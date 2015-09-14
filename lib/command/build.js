 'use strict';

var build       = exports;
var fs          = require('fs');
var fse         = require('fs-extra');
var expand      = require('fs-expand');
var node_path   = require('path');
var semver      = require('semver-extra');
var semver_helper = require('../util/semver');
var async       = require('async');
var cortex_json   = require('read-cortex-json');
var ln          = require('../util/link');
var run_scripts = require('../util/run-scripts');
var makeArray   = require('make-array');
var mix         = require('mix2');
var builder     = require('neuron-builder');
var ngraph      = require('neuron-graph');
var neuron      = require('neuronjs');
var util        = require('util');
var MD5         = require('MD5');
var tar         = require('tar');
var node_zlib   = require('zlib');
var request     = require('request');
var mkdirp      = require('mkdirp');
var depManager  = require('../util/dependency-manager.js');
var loaderUtil  = require('../util/loader.js');

// @param {Object} options
//      see ./lib/option/build.js for details
build.run = function(options, callback) {
  this.MESSAGE = this.locale.require('command-build');
  options.install = options['install-build'];
  options.prerelease = options.prerelease || this.profile.get('prerelease');

  var self = this;
  var tasks = options.install
    ? [
      'simplely_read_cortex_json',
      'read_cortex_config_js',
      'prepare_build_type',
      'run_preinstall_script',
      'run_prebuild_script',
      'build_process',
      'server_link'
    ] : [
      'read_cortex_json',
      'clean_cortex_json',
      'read_cortex_config_js',
      'prepare_build_type',
      'run_preinstall_script',
      'run_prebuild_script',
      // #478
      // `cortex.main` and many other files might have not been generated before `cortex.scripts`
      // so, we clean cortex_json
      'build_process',
      'server_link',
      'run_postbuild_script',
      'run_postwatch_script'
    ];
  async.eachSeries(tasks, function (task, done) {
    self[task](options, done);
  }, callback);
};

build.read_cortex_config_js = function(options, callback){
  var self = this;
  loaderUtil.getLoader(self, options, callback);
}

build.get_entries = function(options){
  var pkg = options.pkg;
  var entries = [].concat(pkg.entries);
  if (pkg.main && !~entries.indexOf(pkg.main)) {
    entries.push(pkg.main);
  }
  return entries;
};

build.prepare_build_type = function(options, callback){
  var pkg = options.pkg;
  var entries = this.get_entries(options);
  var csses = pkg.css;
  var file = options.file;

  function hasFile(list){
    return list.map(function(rel){
      return node_path.join(options.cwd, rel);
    }).indexOf(file) > -1;
  }

  function isDir(){
    var dir_paths = [];
    for(var dir in pkg.directories){
      if(dir == 'dist'){continue;}
      dir_paths.push(node_path.join(options.cwd, pkg.directories[dir]));
    }
    if(!file){return false;}

    return dir_paths.some(function(dir){
      return file.indexOf(dir) == 0;
    });
  }

  if(hasFile(entries) || depManager.getRoot(file)){
    options.build_type = 'js';
  }else if(hasFile(csses)){
    options.build_type = 'css';
  }else if(isDir()){
    options.build_type = 'dir';
  }else{
    options.build_type = 'full';
  }

  callback();
};

build.simplely_read_cortex_json = function (options, callback) {
  // If install from cache, cortex.json will be enhanced json.
  var file = node_path.join(options.cwd, 'cortex.json');
  var self = this;
  fse.readJson(file, function (err, json) {
    if (err) {
      return cb(err);
    }

    function cb (err, json) {
      if (err) {
        if (err.message) {
          err.message += ' File: "' + file + '"';
        }
        return callback(err);
      }
      options.pkg = json;
      self.add_prerease(options, json);
      callback(null);
    }

    // Legacy
    // Before cortexjs/read-cortex-json#11,
    // the `main`, `css` and `entries` are not always existing.
    if (!('main' in json) || !util.isArray(json.css) || !util.isArray(json.entries)) {
      return cortex_json.clean(options.cwd, json, cb);
    }

    cb(null, json);
  }.bind(this));
};


build.read_cortex_json = function(options, callback) {
  var self = this;
  cortex_json.extra(options.cwd, function (err, pkg) {
    if (err) {
      return callback(err);
    }
    options.pkg = pkg;
    self.add_prerease(options, pkg);
    callback(null);
  });
};


build.add_prerease = function (options, pkg) {
  var pr = options.prerelease;
  if (pr) {
    var version = pkg.version;
    pkg.version = semver_helper.add_prerelease(version, pr);
    if (!semver.isStable(version) && !semver.isPrerelease(version)) {
      this.logger.warn(
          'Package "' + pkg.name + '@' + version + '" is already a prerelease version, '
        + 'but will be built as "' + pkg.version + '" according to option or config.'
      );
    }
  }
};


build.clean_cortex_json = function (options, callback) {
  cortex_json.clean(options.cwd, options.pkg, callback);
};


// Run custom build scripts, such as 'grunt'
build.run_preinstall_script = function(options, callback) {
  if (!options.preinstall) {
    return callback(null);
  }
  this.run_script('preinstall', options, callback);
};


// Run custom build scripts, such as 'grunt'
build.run_prebuild_script = function(options, callback) {
  // #436: if build when install, it should not run scripts.prebuild
  if (!options.prebuild) {
    return callback(null);
  }

  if(options.build_type != 'full'){
    return callback(null);
  }

  this.run_script('prebuild', options, callback);
};

build.run_postbuild_script = function(options, callback){
  if (!options.prebuild) {
    return callback(null);
  }
  this.run_script('postbuild', options, callback);
}

// Hook for watcher first build
// you can do stuffs like opening browser here
build.run_postwatch_script = function(options, callback){
  if (!options.prebuild || !options.init) {
    return callback(null);
  }

  this.run_script('postwatch', options, callback);
}


build.run_script = function(script, options, callback) {
  var pkg = options.pkg;
  var scripts =
    makeArray(pkg.scripts && pkg.scripts[script])
    // skip empty scripts
    .filter(Boolean);

  if (!scripts.length) {
    return callback(null);
  }

  var self = this;

  this.logger.info('{{cyan run}} "scripts.' + script + '" ...');

  run_scripts(scripts, options).on('spawn', function(command) {
    self.logger.info(' - {{cyan exec}} "' + command + '" ...');

  }).on('close', function(code, signal) {
    if (code) {
      callback({
        code: 'EBUILDSCRIPT',
        message: 'build step "scripts.' + script + '" executes as a failure. exit code: ' + code,
        data: {
          code: code,
          signal: signal,
          script: script
        }
      });
    } else {
      callback(null);
    }

  }).on('error', function(err) {
    self.logger.warn('"scripts.' + script + '" let out an error: ' + err);
  });
};


build.build_process = function(options, callback) {
  var pkg = options.pkg;
  var to = node_path.join(options.dest, pkg.name, pkg.version);
  options.to = to;

  var basic_tasks = [
    'write_cortex_json',
    'copy_shrinkwrap_json',
    'build_engine'
  ];

  // distribution directory
  var dist = options.pkg.directories && options.pkg.directories.dist;
  if (dist) {
    options.dist = dist;
    basic_tasks.push(
      'check_dist'
    );
  } else {
    basic_tasks.push(
      'copy_csses',
      'copy_directories',
      'build_modules',
      'write_md5_json',
      'generate_md5_files',
      'generate_config'
    );
  }

  var self = this;

  if(options.build_type == 'full'){
    basic_tasks.unshift('clean_dest');
  }

  async.eachSeries(basic_tasks, function (task, done) {
    self[task](options, done);
  }, callback);
};


// We should clean the dest folder before we
build.clean_dest = function (options, callback) {
  fs.exists(options.to, function (exists) {
    if (!exists) {
      return callback(null);
    }

    // #477
    // If we delete some files,
    // these files such as "cortex-shrinkwrap.json" and "src/*" should also be removed
    // from the dest folder.
    fse.remove(options.to, callback);
  });
};


build.is_facade_package = function(pkg){
  var name = pkg.name;
  return name.indexOf("app-") == 0 || pkg.type == "app";
};

build.traverse_file_md5 = function(options, callback){
  var to = options.dir;
  var ignore = options.ignore;
  var fullMD5 = options.fullMD5;
  var result = {};
  function readdir(dir, callback){
    fs.readdir(dir, function(err, list){
      async.map(list, function(item, done){
        if(item.match(ignore)){
          return done(null);
        }
        var fullpath = node_path.join(dir, item);

        fs.stat(fullpath, function(err, stat){
          if(err){
            return done(err);
          }
          if(stat.isDirectory()){
            readdir(fullpath, done);
          }else{
            fs.readFile(fullpath, function(err, content){
              if(err){
                return done(err);
              }
              var md5 = MD5(content);
              if(!fullMD5){
                md5 = md5.slice(0,8);
              }
              result[node_path.relative(to, fullpath)] = md5;
              done(null);
            });
          }
        });
      }, function(err){
        callback(err);
      });
    });
  }

  readdir(to, function(err){
    callback(err, result);
  });
}

build.write_md5_json = function(options, callback){
  if(!build.is_facade_package(options.pkg)){
    return callback(null);
  }
  var to = options.to;
  var md5_file = node_path.join(options.to, 'md5.json');
  var logger = this.logger;

  build.traverse_file_md5({
    dir: to,
    ignore: "cortex.json",
    fullMD5: !!options["full-md5"]
  }, function(err, md5){
    if(err){
      return callback(err);
    }

    logger.info('{{cyan write}} ' + md5_file);
    fse.outputJson(md5_file, md5, callback);
  });
}

build.generate_md5_files = function(options, callback){
  if(!build.is_facade_package(options.pkg)){
    return callback(null);
  }
  if(!options["generate-md5"]){
    return callback(null);
  }

  var logger = this.logger;
  var to = options.to;
  var md5_file = node_path.join(options.to, 'md5.json');
  function appendMD5(path, md5){
    return
  }
  fse.readJson(md5_file, function(err, json){
    if(err){
      return callback(err);
    }

    var path_objs = Object.keys(json).map(function(path){
      return {
        full_path: node_path.join(to, path),
        path: path
      }
    });
    async.map(path_objs, function(path_obj, done){
      var md5 = json[path_obj.path];
      var ext = node_path.extname(path_obj.full_path);
      var md5_path = path_obj.full_path.split(ext)[0] + "_" + md5 + ext;
      logger.info("{{cyan copy}} " + md5_path);
      fse.copy(path_obj.full_path, md5_path, done)
    }, callback);
  });
}

build.write_cortex_json = function (options, callback) {
  var cortex_file = node_path.join(options.to, 'cortex.json');
  fse.outputJson(cortex_file, options.pkg, callback);
};


build.copy_shrinkwrap_json = function (options, callback) {
  this.copy(options.cwd, options.to, 'cortex-shrinkwrap.json', callback);
};


build.server_link = function (options, callback) {
  if (options.install) {
    return callback(null);
  }

  if(options.build_type != 'full'){
    return callback(null);
  }

  var built_root = this.profile.get('built_root');
  if (built_root === options.dest) {
    return callback(null);
  }

  var pkg_dir = node_path.join(options.pkg.name, options.pkg.version);
  var from = node_path.join(built_root, pkg_dir);
  var to = node_path.join(options.dest, pkg_dir);
  var logger = this.logger;
  ln.link(from, to, function (err) {
    if (err) {
      return callback(err);
    }

    logger.info('{{cyan link}} ' + from + ' -> ' + to);
    callback(null);
  });
};


build.check_dist = function (options, callback) {
  var rel_dist = options.dist;
  var dist = node_path.join(options.cwd, rel_dist);
  // if `dist` dir exists, skip building and just copy it
  fs.exists(dist, function(exists) {
    if (!exists) {
      // if `cortex.directories.dist` is declared, the dir must be existed.
      return callback({
        code: 'DIST_NOT_FOUND',
        message: 'dist dir "' + dist + '" does not exist.',
        data: {
          dist: dist
        }
      });
    }

    this.logger.info('dist dir "' + dist + '" found, {{cyan skip}} building ...');
    this.copy_dist(rel_dist, options, callback);
  }.bind(this));
};


// copy dist dir to the destination dirs
build.copy_dist = function(dist, options, callback) {
  var self = this;
  var tasks = options.tasks;
  var dist_dir = node_path.join(options.cwd, dist);
  self.copy(dist_dir, options.to, null, callback);
};


// Builds JavaScript modules
build.build_modules = function(options, callback) {
  var pkg = options.pkg;
  var build_type = options.build_type;

  if(!this._is_type(build_type, 'js')){
    return callback(null);
  }

  var loaders = options.build_config.loaders || [];
  var loader_version = options.loader_version || {};

  // `pkg.entries` must be an array
  var entries = this.get_entries(options);

  if (!entries.length) {
    // Pure css package.
    return callback(null);
  }

  var cwd = options.cwd;
  var to = options.to;
  var self = this;

  if(build_type === 'js'){
    entries = [];
    var rootFiles = depManager.getRoot(options.file);
    rootFiles.map(function (file) {
      entries.push(node_path.relative(options.cwd, file));
    });
  }

  async.eachSeries(entries, function (entry, done) {
    var from = node_path.join(cwd, entry);
    builder({
      cwd: cwd,
      targetVersion: pkg.version,
      pkg: options.pkg,
      loaders: loaders,
      loader_version: loader_version
    })
    .on('warn', function (warn) {
      self.logger.warn(warn.message || warn);
    })
    .on('dependency', function(mod, parent){
      depManager.add(mod, parent);
    })
    .parse(from, function (err, content) {
      if (err) {
        return done(err);
      }

      var file_to = entry === pkg.main
        // It is a convention that main entry will built to <name>.js
        ? pkg.name + '.js'
        : entry;

      if (file_to != file_to.toLowerCase()) {
        self.logger.warn(util.format('"%s" contains uppercase characters', file_to));
        file_to = file_to.toLowerCase();
      }

      var path_to = node_path.join(to, file_to);
      fse.outputFile(path_to, content, function (err) {
        if (err) {
          return done(err);
        }

        self.logger.info('{{cyan write}} ' + path_to);
        done(null);
      });
    });
  }, callback);
};

build._is_type = function(build_type, type){
  // build_type is from step prepare filelist
  return build_type == 'full' || build_type == type;
};

build.copy_csses = function (options, callback) {
  var css = options.pkg.css;
  var build_type = options.build_type;
  if (!css) {
    return callback(null);
  }

  if(!this._is_type(build_type, 'css')){
    return callback(null);
  }

  var self = this;
  var to = options.to;

  if(build_type == 'css'){
    css = [node_path.relative(options.cwd, options.file)];
  }

  async.eachSeries(css, function (path, done) {
    var from = options.cwd;
    var css_path = node_path.join(from, path);

    self.copy(from, to, path, function (err) {
      if (err && err.code === 'SRC_NOT_FOUND') {
        err = {
          code: 'CSS_NOT_FOUND',
          message: '`pkg.css`, "' + path + '" is declared but not found.',
          data: {
            path: path
          }
        };
      }
      if(err){
        return done(err);
      }
      var csspath = node_path.resolve(from, path);

      fs.stat(csspath, function(err, stat){
        if(err){return done(err);}

        if(stat.isFile()){
          self.parse_css_images(csspath, function(err, image_paths){
            if(err){return done(err);}

            async.eachSeries(image_paths, function(image_path, done){
              var css_dir = node_path.dirname(csspath);
              var full_image_path = node_path.join(css_dir, image_path);
              self.copy(from, to, node_path.relative(from, full_image_path), done);
            }, done);
          });
        }else{
          done(null);
        }
      });


    }, true);
  }, callback);
};

build.parse_css_images = function(csspath, done){
  var self = this;

  var image_path_cache = build.image_path_cache = build.image_path_cache || {};

  fs.readFile(csspath, function(err, content){
    if(err){return done(err);}
    /**
     * match
     * 1. url(a.png)
     * 2. url('http://i1.static.dp/s/c/i/b.png')
     * 3. url("./c.png")
     */
    var reg = /url\(\s*(['"]?)([^"'\)]*)\1\s*\)/g;
    var m;
    var imgpath;
    var image_paths = [];

    function isRelative(imgpath) {
      return !/^https?:\/\//.test(imgpath);
    }

    function isDataURI(imgpath){
      return imgpath.indexOf("data:") == 0;
    }

    while(m = reg.exec(content)){
      imgpath = m[0].match(/url\(\s*(['"]?)([^"'\)]*)\1\s*\)/)[2];
      if(isRelative(imgpath) && !isDataURI(imgpath) && !image_path_cache[imgpath]){
        image_paths.push(imgpath);
        image_path_cache[imgpath] = true;
      }
    }

    done(null,image_paths);
  });


}


build.copy_directories = function(options, callback) {
  var self = this;
  var pkg = options.pkg;
  var cwd = options.cwd;
  var directories = pkg.directories || {};
  var to = options.to;
  var file = options.file;
  var build_type = options.build_type;

  if(!this._is_type(build_type, 'dir')){
    return callback(null);
  }

  var tasks = [
    // We only support `directories.src` for now.
    'src',
    'html',
    'img',
    'font'
  ].filter(function (dir) {
    var proj_dir = directories[dir];
    if(!file){
      return proj_dir;
    }else{
      return proj_dir && file.indexOf(node_path.join(cwd, proj_dir)) == 0;
    }
  });


  async.eachSeries(tasks, function (name, done) {
    var dir = directories[name];
    self.copy(cwd, to, dir, function (err) {
      if (err && err.code === 'SRC_NOT_FOUND') {
        err = {
          code: 'DIR_NOT_FOUND',
          message: '`directories.' + name + '.' + dir + '` is defined in cortex.json, but not found.',
          data: {
            name: name,
            dir: dir
          }
        };
      }
      done(err);
    }, true);

  }, callback);
};


// Copy item from `from` to `to`
// @param {String=} item If is undefined, will copy `from` to `to`
// @param {Boolean} strict
build.copy = function(from, to, item, callback, strict) {
  var self = this;
  if (from === to) {
    callback(null);
    return;
  }

  if (item) {
    if (item != item.toLowerCase()) {
      self.logger.warn(util.format('"%s" contains uppercase characters', item));
    }

    item = item.toLowerCase();
    from = node_path.join(from, item);
    to = node_path.join(to, item);
  }

  fs.exists(from, function (exists) {
    if (!exists) {
      // if strict and the source is not found, an error will throw.
      if (strict) {
        return callback({
          code: 'SRC_NOT_FOUND'
        });
      } else {
        return callback(null);
      }
    }

    self.logger.info('{{cyan copy}} ' + from + ' -> ' + to);
    var err;
    try{
      fse.copySync(from, to);
    }catch(e){
      err = e;
    }
    callback(err);
  });
};


build.build_engine = function (options, callback) {
  if (options.install) {
    return callback(null);
  }
  var dest = node_path.join(options.dest, 'neuron', neuron.version(), 'neuron.js');
  var neuron_js = node_path.join(options.dest, 'neuron.js');

  // Chrome on Windows could not open a symlink of a javascript file,
  // so we just write both of the files, and use no symlink.
  async.each([dest, neuron_js], function (to, done) {
    neuron.write(to, done, true);
  }, callback);
};


build.generate_config = function (options, callback) {
  if (options.install || !options.config) {
    return callback(null);
  }

  var pkg = options.pkg;
  var config = {};
  async.series([
    function (done){
      ngraph(pkg, {
        built_root: node_path.join(options.cwd, 'neurons'),
        cwd: options.cwd
      }, function(err, graph, shrinkwrap){
        done(err, graph);
      });
    },
    function (done){
      var md5_file = node_path.join(options.to, 'md5.json');
      if(build.is_facade_package(options.pkg)){
        fse.readJson(md5_file, done);
      }else{
        done(null);
      }
    }
  ], function(err, results){
    if(err){
      return callback(err);
    }
    var graph = results[0];
    var md5 = results[1];
    var graph_entry = graph._;
    graph_entry[pkg.name + '@*'] = graph_entry[pkg.name + '@' + pkg.version];

    var config_file = node_path.join(options.dest, 'config.js');
    if(graph){config.graph = graph;}
    if(md5 && options["generate-md5"]){
      config.hash = {};
      config.hash[pkg.name + "@" + pkg.version] = md5;
    }
    fse.outputFile(config_file, 'neuron.config(' + JSON.stringify(config, null, 2) + ');', callback);
  });
};
