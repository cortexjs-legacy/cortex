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

  // if the destination is not specified by user
  if (!options.dest) {
    var entry_cwd = options['entry-cwd'];

    if (!profile.get('server_mode') && entry_cwd) {
      // if cortex is not running in server mode, see 'doc/<language>/server-mode.md',
      // we will build module into <root-cwd>/neurons folder
      options.dest = node_path.join(entry_cwd, 'neurons');

    } else {
      // If server_mode is on, we assume that we always use cortex server to develop,
      // and all packages will be built to a certain dir.
      options.dest = profile.get('built_root');
    }
  }

  this.MESSAGE = this.locale.require('command-build');

  var self = this;
  async.series([
    function(done) {
      self.read_package_json(options, done);
    },
    function(done) {
      self.run_preinstall_script(options, done);
    },
    function(done) {
      // run custom build script
      self.run_prebuild_script(options, done);
    },
    function(done) {
      // determine build tasks
      self.determine_tasks(options, done);
    },
    function(done) {
      // real building
      self.build(options, done);
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


build.determine_tasks = function(options, callback) {
  var cache_root = this.profile.get('cache_root');
  var tasks = options.tasks = {};
  var name = options.pkg.name;
  var version = options.pkg.version;
  var built_root = options.dest;

  var parsed = semver_helper.parse(version);

  if (!parsed) {
    return callback({
      code: 'EINVALIDVER',
      message: 'invalid semantic version "' + version + '" in package.json, see http://semver.org for details.',
      data: {
        version: version
      }
    });
  }

  // Cortex will no longer publish prerelease versions into the registry,
  // so use the original version directly.
  tasks[version] = node_path.join(built_root, name, version);

  var self = this;

  if (options.ranges) {
    cortex_json.cached_document(name, cache_root, function(err, json) {
      if (err) {
        return callback(err);
      }

      var versions = json && json.versions && Object.keys(json.versions) || [];
      versions.sort(semver.rcompare);

      // '1.2.3' -> '~1.2.0'
      var range = semver_helper.get_base_range(parsed);
      var max_patch = semver.maxSatisfying(versions, range);
      var max_stable_patch = stable.maxSatisfying(versions, range);
      var max = versions[0];
      var max_stable = stable.max(versions);

      if (
        // [1]
        // If the current minor(feature) doesn't exist, it is the max matched patch of the current minor
        !max_patch ||

        // Greater or equal to
        semver.gte(version, max_patch) ||

        // If the current version is greater or equal to the max stable patch,
        // we also let it go
        max_stable_patch && semver.gte(version, max_stable_patch)
      ) {
        // >>>> range
        tasks[range] = node_path.join(built_root, name, range);

        // if the package is not the latest patch,
        // it's impossible to be the latest of all versions
        if (
          // if there's no versions on the registry,
          // See 1
          !max ||

          // if current version is the greatest
          semver.gte(version, max) ||
          max_stable && semver.gte(version, max_stable)
        ) {
          // >>>> latest
          tasks.latest = node_path.join(built_root, name, 'latest');
        }
      }

      // {
      //     '1.2.3': '/xxx/~1.2.0',
      //     'latest': '/xxx/latest'
      // }
      callback(null, tasks);
    });

  } else {
    callback(null, tasks);
  }
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

    var tasks = options.tasks;
    async.each(Object.keys(tasks), function(target_version, done) {
      var to = tasks[target_version];
      async.parallel([
        function (done) {
          // Build JavaScript modules
          self.build_modules(target_version, to, options, done);
        },
        function (done) {
          self.copy(options.cwd, to, 'cortex-shrinkwrap.json', done);
        }
        function (done) {
          // Copy css
          self.copy_csses(sub_done);
        },
        function (done) {
          // Copy directories
          self.copy_directories(sub_done);
        }
      ], done);
    }, callback);
  });
};


build.dist = function (dist, options, callback) {
  dist = node_path.join(options.cwd, dist);
  // if `dist` dir exists, skip building and just copy it
  fs.exists(dist, function(exists) {
    if (!exists) {
      // if `cortex.directories.dist` is declared, the dir must be existed.
      return callback({
        code: 'EDISTNOTEXISTS',
        message: 'dist dir "' + dist + '" does not exist.',
        data: {
          dist: dist
        }
      });
    }

    this.logger.info('dist dir "' + dist + '" found, {{cyan skip}} building ...');
    this.copy_dist(dist, options, callback);
  }.bind(this));
};


// copy dist dir to the destination dirs
build.copy_dist = function(dist, options, callback) {
  var self = this;
  var tasks = options.tasks;
  async.each(Object.keys(tasks), function(task, done) {
    var to = tasks[task];
    self.logger.info('{{cyan copy}} "' + dist + '" to "' + to + '".');
    self.copy(dist, to, done);
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
      var main_path = node_path.join(cwd, main_entry);

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
    }

    if (!options.pkg.css) {
      return callback({
        code: 'NO_ENTRY_FOUND',
        message: 'Both `package.main` and `package.css` are not found. You need to define at least one.'
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
  if (!options.pkg.entires) {
    options.entries = [options.main_entry];
    return callback(null);
  }

  expand(pkg.entries, {
    cwd: cwd
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
build.build_modules = function(target_version, to, options, callback) {
  // Pure css package.
  if (!options.main_entry) {
    return callback(null);
  }

  var self = this;
  var cwd = options.cwd;
  async.each(options.entries, function (entry, done) {
    // Standardize entries
    // './index.js' -> 'index.js'
    entry = node_path.join('.', entry);
    var from = node_path.join(cwd, entry);

    builder(from, {
      cwd: cwd,
      targetVersion: target_version,
      pkg: options.pkg

    }, function (err, content) {
      if (err) {
        return done(err);
      }

      var file_to = entry === options.main_entry
        // main entry will
        ? options.pkg.name + '.js'
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


build.copy_directories = function(to, options, callback) {
  var pkg = options.pkg;
  var directories = pkg.directories || {};

  var tasks = [
    // We only support `directories.src` for now.
    'src'
  ]
  .filter(function (dir) {
    return directories[dir];
  });

  async.each(tasks, function (name, done) {
    var dir = directories[dir];
    this.copy(options.cwd, to, dir, function (err) {
      if (err) {
        if (err.code === 'SRC_NOT_FOUND') {
          return done({
            code: 'DIR_NOT_FOUND',
            message: '`directories.' + name + '` is defined in cortex.json, but not found.',
            data: {
              name: name,
              dir
            }
          });
        } else {
          return done(err);
        }
      }
      done(null);
    }, true);

  }.bind(this), callback);
};


// Copy files from `from` to `to`
// @param {Boolean} strict 
build.copy = function(from, to, item, callback, strict) {
  var self = this;
  if (from === to) {
    callback(null);
    return;
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
