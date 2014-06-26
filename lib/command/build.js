 'use strict';

var build       = exports;
var fs          = require('fs');
var fse         = require('fs-extra');
var expand      = require('fs-expand');
var node_path   = require('path');
var semver      = require('semver');
var stable      = require('semver-stable');
var async       = require('async');
var cortex_json   = require('read-cortex-json');
var semver_helper = require('../util/semver');
var lang        = require('../util/lang');
var spawns      = require('spawns');
var builder     = require('neuron-builder');
var nconfig     = require('neuron-config');

// @param {Object} options
//      see ./lib/option/build.js for details
build.run = function(options, callback) {
  this.MESSAGE = this.locale.require('command-build');

  var self = this;
  async.eachSeries([
    'read_package_json',
    // run custom build script
    'run_preinstall_script',
    'run_prebuild_script',
    // real building
    'build',
    'server_link'
  ], function (task, done) {
    self[task](options, done);
  }, callback);
};


build.read_package_json = function(options, callback) {
  cortex_json.read(options.cwd, function(err, pkg) {
    options.pkg = pkg;
    callback(err);
  });
};


// Creates a symlink from `from` to `to`.
// If `from` exists, it will remove it.
build.link = function (from, to, callback) {
  function link () {
    var dir = node_path.dirname(from);
    fse.ensureDir(dir, function (err) {
      if (err) {
        return callback(err);
      }
      fs.symlink(to, from, callback);
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


// Run custom build scripts, such as 'grunt'
build.run_preinstall_script = function(options, callback) {
  if (!options.preinstall) {
    return callback(null);
  }
  this.run_script('preinstall', options, callback);
};


// Run custom build scripts, such as 'grunt'
build.run_prebuild_script = function(options, callback) {
  if (!options.prebuild) {
    return callback(null);
  }
  this.run_script('prebuild', options, callback);
};


build.run_script = function(script, options, callback) {
  var pkg = options.pkg;
  var scripts = lang.makeArray(pkg.scripts && pkg.scripts[script])
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


build.build = function(options, callback) {
  var pkg = options.pkg;
  // distribution directory
  var dist = lang.object_member_by_namespaces(options.pkg, 'directories.dist');
  var to = node_path.join(options.dest, pkg.name, pkg.version);
  options.to = to;

  if (dist) {
    return this.dist(dist, options, callback);
  }

  var self = this;
  this.check_entry(options, function(err) {
    if (err) {
      return callback(err);
    }

    async.parallel([
      function (done) {
        // Build JavaScript modules
        self.build_modules(to, options, done);
      },
      function (done) {
        self.copy(options.cwd, to, 'cortex-shrinkwrap.json', done);
      },
      function (done) {
        // Copy css
        self.copy_csses(to, options, done);
      },
      function (done) {
        // Copy directories
        self.copy_directories(to, options, done);
      },
      function (done) {
        self.generate_config(options, done);
      }
    ], callback);
  });
};


build.server_link = function (options, callback) {
  if (!options.link) {
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


build.dist = function (dist, options, callback) {
  var rel_dist = dist;
  var dist = node_path.join(options.cwd, dist);
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


build.check_entry = function (options, callback) {
  var self = this;
  this.main_exists(options, function (exists) {
    if (exists) {
      var cwd = options.cwd;
      var pkg = options.pkg;
      // the module '<name>.js'
      var main_by_name = node_path.join(cwd, pkg.name) + '.js';
      var main_path = node_path.join(cwd, options.main_entry);

      fs.exists(main_by_name, function(exists) {
        if (exists && main_by_name !== main_path) {
          return callback({
            code: 'MAIN_CONFLICT',
            message: 'if "' + pkg.name + '.js" exists, it must be `package.main`, or you should rename it.',
            data: {
              name: pkg.name,
              main: pkg.main
            }
          });
        }
        self.get_entries(options, callback);
      });
      return;
    }

    if (!options.pkg.css) {
      return callback({
        code: 'NO_ENTRY_FOUND',
        message: 'Both `cortex.main` and `cortex.css` are not found in "' 
          + options.pkg.name + '@' + options.pkg.version + '". ' 
          + 'it needs to define at least one.'
      });
    }
    callback(null);
  });
};


build.main_exists = function (options, callback) {
  var main_entry = options.pkg.main || 'index.js';

  // Standardize main entry
  // './index' -> './index.js'
  main_entry = this.ensure_ext(main_entry, 'js');
  // './index.js' -> 'index.js'
  main_entry = node_path.join('.', main_entry);
  var main_file = node_path.join(options.cwd, main_entry);

  fs.exists(main_file, function (exists) {
    if (exists) {
      options.main_entry = main_entry;
    }
    callback(exists);
  });
};


// Gets all entries, including
// - pkg.main
// - pkg.entries
build.get_entries = function(options, callback) {
  var pkg_entries = options.pkg.entries;
  if (!pkg_entries) {
    options.entries = [options.main_entry];
    return callback(null);
  }

  expand(pkg_entries, {
    cwd: options.cwd
  }, function (err, entries) {
    if (err) {
      return callback(err);
    }
    options.entries = entries;
    // prevent duplication
    if (!~entries.indexOf(options.main_entry)) {
      entries.push(options.main_entry);
    }

    callback(null);
  });
};


build.ensure_ext = function(path, ext) {
  var regex = new RegExp('\\.' + ext + '$', 'i');
  if (!regex.test(path)) {
    path += '.' + ext;
  }
  return path;
};


// Builds JavaScript modules
build.build_modules = function(to, options, callback) {
  // Pure css package.
  if (!options.main_entry) {
    return callback(null);
  }

  var self = this;
  var cwd = options.cwd;
  var pkg = options.pkg;
  async.each(options.entries, function (entry, done) {
    // Standardize entries
    // './index.js' -> 'index.js'
    entry = node_path.join('.', entry);
    var from = node_path.join(cwd, entry);

    builder(from, {
      cwd: cwd,
      targetVersion: pkg.version,
      pkg: options.pkg

    }, function (err, content) {
      if (err) {
        return done(err);
      }

      var file_to = entry === options.main_entry
        // main entry will
        ? pkg.name + '.js'
        : entry;

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


build.copy_csses = function (to, options, callback) {
  var css = options.pkg.css;
  if (!css) {
    return callback(null);
  }

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


build.copy_directories = function(to, options, callback) {
  var pkg = options.pkg;
  var directories = pkg.directories || {};

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


build.generate_config = function (options, callback) {
  if (!options._config) {
    return callback(null);
  }

  var pkg = options.pkg;
  nconfig({
    cwd: options.cwd,
    built_root: options.dest,
    cache_root: this.profile.get('cache_root'),
    pkg: pkg

  }, function (err, config) {
    if (err) {
      return callback(err);
    }

    var tree = config.tree;
    var tasks = ['_', pkg.name, '*'];
    tasks.reduce(function (prev, key, index) {
      if (index === tasks.length - 1) {
        prev[key] = pkg.version;
        return;
      }

      return prev[key] || (prev[key] = {});
    }, tree);

    var config_file = node_path.join(options.dest, 'config.js');
    fse.outputFile(config_file, 'neuron.config(' + JSON.stringify(config, null, 2) + ');', callback);
  });
};
