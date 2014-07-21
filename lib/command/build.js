 'use strict';

var build       = exports;
var fs          = require('fs');
var fse         = require('fs-extra');
var expand      = require('fs-expand');
var node_path   = require('path');
var semver      = require('semver');
var async       = require('async');
var cortex_json   = require('read-cortex-json');
var semver_helper = require('../util/semver');
var makeArray   = require('make-array');
var spawns      = require('spawns');
var builder     = require('neuron-builder');
var ngraph      = require('neuron-graph');
var neuron      = require('neuronjs');
var util        = require('util');

// @param {Object} options
//      see ./lib/option/build.js for details
build.run = function(options, callback) {
  this.MESSAGE = this.locale.require('command-build');
  options.install = options['install-build'];

  var self = this;
  async.eachSeries([
    'read_cortex_json',
    'run_preinstall_script',
    'run_prebuild_script',
    'build_process',
    'server_link'
  ], function (task, done) {
    self[task](options, done);
  }, callback);
};


build.read_cortex_json = function(options, callback) {
  function cb (err, json) {
    if (err) {
      return callback(err);
    }
    
    if (options.install && !json.main && !json.css.length) {
      return callback({
        code: 'REFUSE_INSTALL',
        message: 'Refuses to install a package without {{bold BOTH}} `cortex.main` and `cortex.css`'
      });
    }

    options.pkg = json;
    callback(null);
  }

  if (options.install) {
    // If install from cache, cortex.json will be enhanced json.
    var file = node_path.join(options.cwd, 'cortex.json');
    fse.readJson(file, function (err, json) {
      if (err) {
        return cb(err);
      }
      cortex_json.clean(options.cwd, json, cb);
    }.bind(this));
  } else {
    cortex_json.enhanced(options.cwd, cb);
  }
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
  this.run_script('prebuild', options, callback);
};


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

  spawns(scripts, {
    cwd: options.cwd,
    stdio: 'inherit'

  }).on('spawn', function(command) {
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
    'build_engine',
    'generate_config'
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
      'build_modules'
    );
  }

  var self = this;
  async.each(basic_tasks, function (task, done) {
    self[task](options, done);
  }, callback);
};


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

  var built_root = this.profile.get('built_root');
  if (built_root === options.dest) {
    return callback(null);
  }

  var pkg_dir = node_path.join(options.pkg.name, options.pkg.version);
  var from = node_path.join(built_root, pkg_dir);
  var to = node_path.join(options.dest, pkg_dir);
  var logger = this.logger;
  this.link(from, to, function (err) {
    if (err) {
      return callback(err);
    }

    logger.info(' {{cyan link}} ' + from + ' -> ' + to);
    callback(null);
  });
};


// Creates a symlink from `from` to `to`.
// If `from` exists, it will remove it.
build.link = function (from, to, callback) {
  function link () {
    var dir = node_path.dirname(from);
    fse.mkdirs(dir, function (err) {
      if (err) {
        return callback(err);
      }
      fs.symlink(to, from, 'dir', callback);
    });
  }

  fs.lstat(from, function (err, stat) {
    // not found
    if (err && err.code === 'ENOENT') {
      return link();
    }

    fse.remove(from, function (err) {
      link();
    });
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
  // `pkg.entries` must be an array
  var entries = [].concat(pkg.entries);
  if (pkg.main && !~entries.indexOf(pkg.main)) {
    entries.push(pkg.main);
  }

  if (!entries.length) {
    // Pure css package.
    return callback(null);
  }

  var cwd = options.cwd;
  var to = options.to;
  var self = this;
  async.each(entries, function (entry, done) {
    var from = node_path.join(cwd, entry);
    builder({
      cwd: cwd,
      targetVersion: pkg.version,
      pkg: options.pkg
    })
    .on('warn', function (warn) {
      self.logger.warn(warn.message || warn);
    })
    .parse(from, function (err, content) {
      if (err) {
        return done(err);
      }

      var file_to = entry === pkg.main
        // It is a convention that main entry will built to <name>.js
        ? pkg.name + '.js'
        : entry;

      var path_to = node_path.join(to, file_to).toLowerCase();
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


build.copy_csses = function (options, callback) {
  var css = options.pkg.css;
  if (!css) {
    return callback(null);
  }
  var to = options.to;
  async.each(css, function (path, done) {
    this.copy(options.cwd, to, path, function (err) {
      if (err && err.code === 'SRC_NOT_FOUND') {
        err = {
          code: 'CSS_NOT_FOUND',
          message: '`pkg.css`, "' + path + '" is declared but not found.',
          data: {
            path: path
          }
        };
      }
      done(err);
    }, true);
  }.bind(this), callback);
};


build.copy_directories = function(options, callback) {
  var pkg = options.pkg;
  var directories = pkg.directories || {};
  var to = options.to;
  var tasks = [
    // We only support `directories.src` for now.
    'src'
  ].filter(function (dir) {
    return directories[dir];
  });

  async.each(tasks, function (name, done) {
    var dir = directories[name];
    this.copy(options.cwd, to, dir, function (err) {
      if (err && err.code === 'SRC_NOT_FOUND') {
        err = {
          code: 'DIR_NOT_FOUND',
          message: '`directories.' + name + '` is defined in cortex.json, but not found.',
          data: {
            name: name,
            dir: dir
          }
        };
      }
      done(err);
    }, true);

  }.bind(this), callback);
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

    self.logger.info(' {{cyan copy}} ' + from + ' -> ' + to);
    fse.copy(from, to, callback);
  });
};


build.build_engine = function (options, callback) {
  if (options.install) {
    return callback(null);
  }
  var dest = node_path.join(options.dest, 'neuron', neuron.version(), 'neuron.js');
  var neuron_js = node_path.join(options.dest, 'neuron.js');
  neuron.write(dest, function (err) {
    if (err) {
      return callback(err);
    }
    this.link(neuron_js, dest, callback);
  }.bind(this));
};


build.generate_config = function (options, callback) {
  if (options.install || !options.config) {
    return callback(null);
  }

  var pkg = options.pkg;
  ngraph(pkg, {
    built_root: options.dest,
    cwd: options.cwd
  }, function (err, graph) {
    if (err) {
      return callback(err);
    }

    var graph_entry = graph._;
    graph_entry[pkg.name + '@*'] = graph_entry[pkg.name + '@' + pkg.version];

    var config = {
      graph: graph
    };

    var config_file = node_path.join(options.dest, 'config.js');
    fse.outputFile(config_file, 'neuron.config(' + JSON.stringify(config, null, 2) + ');', callback);
  });
};
