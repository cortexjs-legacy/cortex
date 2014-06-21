 'use strict';

var build       = module.exports = {};
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

// @param {Object} options
//      see ./lib/option/build.js for details
build.run = function(options, callback) {
  var profile = this.profile;

  options.built_root = profile.get('built_root');
  // if the destination is not specified by user
  if (!options.dest) {
    options.dest = options.built_root;
  }

  this.MESSAGE = this.locale.require('command-build');

  var self = this;
  async.series([
    function(done) {
      self.read_package_json(options, done);
    },
    function(done) {
      self.link_neurons(options, done);
    },
    function(done) {
      self.run_preinstall_script(options, done);
    },
    function(done) {
      // run custom build script
      self.run_prebuild_script(options, done);
    },
    function(done) {
      // real building
      self.build(options, done);
    },
    function(done) {
      self.link_ranges(options, done);
    }
  ], function(err) {
    callback(err);
  });
};


build.read_package_json = function(options, callback) {
  cortex_json.read(options.cwd, function(err, pkg) {
    options.pkg = pkg;
    callback(err);
  });
};

// Creates a symbolic link from neurons -> built_root
build.link_neurons = function (options, callback) {
  if (!options.link) {
    return callback(null);
  }
  var logger = this.logger;
  var neurons = node_path.join(options.cwd, 'neurons');
  this.link(neurons, options.built_root, function (err) {
    if (err) {
      return callback(err);
    }
    logger.info(' {{cyan link}} neurons -> ' + options.built_root);
    callback(null);
  });
};


// Creates a symlink from `from` to `to`.
// If `from` exists, it will remove it.
build.link = function (from, to, callback) {
  function link () {
    fs.symlink(to, from, callback);
    link = null;
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

  if (dist) {
    return this.dist(dist, options, callback);
  }

  var self = this;
  this.check_entry(options, function(err) {
    if (err) {
      return callback(err);
    }

    var to = node_path.join(options.dest, pkg.name, pkg.version);
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
      }
    ], callback);
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
  async.each(Object.keys(tasks), function(task, done) {
    var to = tasks[task];
    self.copy(dist_dir, to, null, done);
  }, callback);
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
        message: 'Both `cortex.main` and `cortex.css` are not found. You need to define at least one.'
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
      fse.mkdirs( node_path.dirname(path_to), function (err) {
        if (err) {
          return done(err);
        }

        self.logger.info('{{cyan write}} ' + path_to);
        fs.writeFile(path_to, content, done);
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

    self.logger.info('{{cyan copy}} ' + from + ' -> ' + to);
    fse.copy(from, to, callback);
  });
};


build.link_ranges = function (options, callback) {
  if (!options.ranges) {
    return callback(null);
  }

  var self = this;
  var logger = this.logger;
  var pkg = options.pkg;
  var cache_root = this.profile.get('cache_root');
  cortex_json.cached_document(pkg.name, cache_root, function(err, json) {
    if (err) {
      return callback(err);
    }

    var versions = json && json.versions && Object.keys(json.versions) || [];
    
    var pkgs_built_root = node_path.join(options.dest, pkg.name);
    var version = pkg.version;
    var parsed = semver_helper.parse(version);
    var to = node_path.join(pkgs_built_root, version);

    function link (from, to, done) {
      logger.info('   <- ' + from);
      self.link(from, to, done);
    }

    var types = ['~', '^', '*'];
    async.each(types, function(type, done) {
      semver_helper.check_version_range(parsed, versions, type, function (range, passed) {
        var from = node_path.join(pkgs_built_root, range);
        // The current version is the max for the current range
        if (passed) {
          return link(from, to, done);
        }

        fs.exists(from, function (exists) {
          if (exists) {
            return done(null);
          }

          // If the symlink does not exist, create it.
          link(from, to, done);
        });
      });
    }, callback);
  });
};
