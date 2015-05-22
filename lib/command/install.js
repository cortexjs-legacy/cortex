'use strict';

var install       = exports;
var semver_helper = require('../util/semver');
var semver        = require('semver-extra');
var cortex_json   = require('read-cortex-json');
var node_path     = require('path');
var async         = require('async');
var spawn         = require('child_process').spawn;
var shrinkwrap    = require('../util/shrinkwrap');
var fs            = require('fs');

// Attension: there will no arguments checking
// @param {Object} options:
// - packages: {Array.<string>} packages to install, ['a@1.0.1', 'b@0.0.2'],
//    notice that the version of each module must be specified:
//    'a' should be 'a@latest', or there will be an failure
// - save: {boolean} save cortexDependencies
// - cwd: {string}
// - _desc: {string} private property, which will never called by command-line
// - recursive: {boolean} if false, cortex will not install dependencies

// @param {function()} callback
install.run = function(options, callback) {
  if (!options.packages.length) {
    this.logger.warn('it seems that there\'s no packages to install.');
    return callback(null);
  }

  options.dest = options.global
    // Install globally
    ? this.profile.get('built_root')
    : (options.dest || node_path.join(options.cwd, 'neurons'));


  options.cache_root = this.profile.get('cache_root');
  async.eachSeries([
    'download_package',
    'build_packages',
    'save_dependencies',
    'update_shrinkwrap',
    'clone_to_workspace'
  ], function (task, done) {
    this[task](options, done);
  }.bind(this), callback);
};


install.download_package = function(options, callback) {
  var command_description = options._desc;
  var packages = options.packages;

  this.logger.info('{{cyan ' + command_description + '}}', packages.join(', '));
  options.skipped = [];

  var self = this;
  // suppose:
  // 1. packages -> ['a@~0.0.1', 'b@0.0.2']
  // 2. dependencies of 'b@0.0.2' -> ['~a@0.1.2']
  this.neuropil.install({
    packages: packages,
    dir: options.cache_root,
    recursive: options.recursive,
    dependency_keys: ['dependencies','asyncDependencies'],
    save: options._save,
    stable: options['stable-only'],
    check_skip: this.should_skip(options),
    prerelease: options._save
      // If save dependencies, it must be local development,
      // so, disable prerelease
      ? false
      : options.prerelease || this.profile.get('prerelease')

  }, function(err, data) {
    if (err) {
      return callback(err);
    }

    if (options.skipped.length) {
      self.logger.info(
        'The packages below are existing and {{cyan skipped}}:\n'
        + options.skipped.map(function (p) {
            return '   - {{gray ' + p + '}}';
          }).join('\n')
        + '\nUse `{{bold cortex install -f}}` to force installing.\n'
      );
      options.skipped.length = 0;
      delete options.skipped;
    }

    options.data = data;
    callback(null);
  });
};


install.should_skip = function (options) {
  if (!options._init || options.force) {
    // If `cortex install <package>` a specific package,
    // never skip
    return function (name, version, callback) {
      callback(false);
    }
  }

  var dest = options.dest;
  var g = options.global;

  // #450
  // Returns checker `function(skip)` to check whether we should
  // skip installing a module
  var self = this;
  return function (name, version, callback) {
    var dir = node_path.join(dest, name, version);
    fs.exists(dir, function (exists) {
      if (exists) {
        options.skipped.push(name + '@' + version);
      }
      callback(exists);
    });
  }
};


// @type {Object} options.data
// {
//     origins: {
//         'a': ['~0.0.1'],
//         'b': ['0.0.2']
//     },

//     documents: {
//         'a': {
//             '0.0.7': <pkg>,
//             '0.1.3': <pkg>
//         },

//         'b': {
//             '0.0.2': <pkg>
//         }
//     },

//     // according to `options.dependency_key`
//     dependencies: {
//         'a': {
//             '0.0.7': {}, // no deps
//             '0.1.3': {}
//         },

//         'b': {
//             '0.0.2': {
//                 'a': '~0.1.2'
//             }
//         }
//     },

//     ranges: {
//         'a': {
//             '~0.0.1': '0.0.7',
//             '~0.1.2': '0.1.3'
//         }
//     }
// }
install.build_packages = function(options, callback) {
  // build packages
  var tasks = [];
  var commander = this.commander;
  var packages = this.iterate_packages(options.data);

  async.each(packages, build_package, callback);
  function build_package (pkg, done) {
    var cwd = node_path.join(options.cache_root, pkg.name, pkg.version, 'package');

    // mock process.argv
    var argv = [
      '', '',
      'build',

      // You need to finish your custom build scripts
      // before publishing into the registry, and cortex will
      // not run `scripts.prebuild` when installing
      '--no-prebuild',

      // run `scripts.preinstall`
      '--preinstall',
      '--cwd', cwd,
      '--dest', options.dest,
      '--install-build'
    ];

    commander.run(argv, done);
  }
};


install.save_dependencies = function(options, callback) {
  if (!options._save) {
    return callback(null);
  }

  var data = options.data;
  var logger = this.logger;
  var self = this;
  cortex_json.read(options.cwd, function(err, ctx) {
    if (err) {
      return callback(err);
    }

    // if --save --save-async, --save-async will be ignored
    var key = self.key_to_save(options);

    var deps = ctx[key] || (ctx[key] = {});
    // var exact_deps = ctx.exactDependencies || (ctx.exactDependencies = {});

    Object.keys(data.origins).forEach(function(name) {
      var versions = data.origins[name];
      var ranges = data.ranges[name] || {};

      versions.forEach(function(version) {
        var exact_version = ranges[version] || version;
        if (!semver.isStable(exact_version)) {
          var dep_pkg = name + '@' + exact_version;
          logger.warn(
            'You are trying to install an {{bold UNSTABLE}} package "' + dep_pkg + '".\n' +
            '  Be very sure to remember to publish "' + dep_pkg + '" then.'
          );
        }
        // It's great that `semver` does a awesome job on prerelease versions:
        // '1.0.0-alpha' satisfies '^1.0.0',
        // so we simply remove prerelease version before saving into field `dependencies`
        deps[name] = semver_helper.convert_to_range(exact_version);
      });
    });

    cortex_json.save(options.cwd, ctx, callback);

    // use_inherits
  }, true);
};


install.update_shrinkwrap = function (options, callback) {
  if (!options._save) {
    return callback(null);
  }

  shrinkwrap.call(this, options.cwd, callback);
};


var ENUM_SAVE = {
  'save': 'dependencies',
  'save-dev': 'devDependencies',
  'save-async': 'asyncDependencies'
};

install.key_to_save = function(options) {
  var save_to;

  Object.keys(ENUM_SAVE).some(function(option) {
    if (options[option]) {
      save_to = ENUM_SAVE[option];
      return true;
    }
  });

  return save_to;
};


install.clone_to_workspace = function(options, callback) {
  if (!options.clone) {
    return callback(null);
  }

  var data = options.data;
  var packages = [];
  var mod;

  // get all origin packages from cli
  for (mod in data.origins) {
    data.origins[mod].forEach(function(v) {
      packages.push({
        name: mod,
        version: v
      });
    });
  }

  var repos = {};
  var logger = this.logger;
  var workspace = this.profile.get('workspace') || options.cwd;

  function clone_module (mod, done) {
    var version = data.ranges[mod.name][mod.version];
    var pkg = data.documents[mod.name].versions[version];

    var is_git = pkg.repository && pkg.repository.type === "git";
    var repo_url = pkg.repository && pkg.repository.url;

    if (!is_git || !repo_url || repos[repo_url]) {
      return done(null);

    } else {
      repos[repo_url] = true;

      logger.info("\n{{cyan clone}}", mod.name + ':', repo_url);
      var dir = node_path.join(workspace, mod.name);

      var child = spawn("git", ["clone", repo_url, dir], {
        stdio: "inherit"
      });

      child.on("close", function(code, signal) {
        if (code) {
          done({
            code: 'EGITCLONE',
            message: 'fails to git-clone "' + repo_url + '"',
            data: {
              repo: repo_url,
              dir: dir
            }
          });
        } else {
          done(null);
        }
      });
    }
  }

  async.each(packages, clone_module, callback);
};

// @param {Object} packages
// @param {function(name, version)} callback
install.iterate_packages = function(data) {
  var packages = [];
  var name;
  var versions;
  for (name in data.dependencies) {
    versions = data.dependencies[name];
    var range = data.ranges[name] || {};
    Object.keys(versions).forEach(function(version) {
      packages.push({
        name: name,
        version: range[version] || version
      });
    });
  }

  return packages;
};
