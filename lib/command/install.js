'use strict';

var install       = exports;
var lang          = require('../util/lang');
var semver_helper = require('../util/semver');
var stable        = require('semver-stable');
var pkg_helper    = require('../util/package');
var node_path     = require('path');
var async         = require('async');
var spawn         = require('child_process').spawn;
var shrinkwrap    = require('../util/shrinkwrap');

// Attension: there will no arguments checking
// @param {Object} options:
// - packages: {Array.<string>} packages to install, ['a@1.0.1', 'b@0.0.2'], notice that the version of each module must be specified:
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

  options.module_root = this.profile.get('cache_root');

  var self = this;
  async.waterfall([
    function (done) {
      self.download_package(options, done);
    },

    function (done) {
      self.build_packages(options, done);
    },

    function (done) {
      self.save_dependencies(options, done);
    },

    function (done) {
      self.update_shrinkwrap(options, done);
    },

    function (done) {
      self.clone_to_workspace(options, done);
    }

  ], callback);
};


install.download_package = function(options, callback) {
  var command_description = options._desc;
  var packages = options.packages;

  this.logger.info('{{cyan ' + command_description + '}}', packages.join(', '));

  // suppose:
  // 1. packages -> ['a@~0.0.1', 'b@0.0.2']
  // 2. dependencies of 'b@0.0.2' -> ['~a@0.1.2']
  this.neuropil.install({
    packages: packages,
    dir: options.module_root,
    recursive: options.recursive,
    dependency_key: 'dependencies'

  }, function(err, data) {
    if (err) {
      return callback(err);
    }

    options.data = data;
    callback(null);
  });
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

  async.each(packages, build_package, function(err) {
    callback(err);
  });

  function build_package (pkg, done) {
    var cwd = node_path.join(options.module_root, pkg.name, pkg.version, 'package');

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
      '--cwd', cwd
    ];

    // #323: if `cortex install xxx` outside a repo,
    // `options.cwd` will be null, causing the failure of minimist.
    if (options.cwd) {
      // if `options.cwd` is not specified packages will be installed globally
      argv.push('--entry-cwd', options.cwd);
    }

    commander.run(argv, done);
  }
};


install.save_dependencies = function(options, callback) {
  var self = this;

  // save to package.json
  if (options._save) {
    var data = options.data;
    var logger = this.logger;
    pkg_helper.get_original_package(options.cwd, function(err, ctx) {
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
          if (!stable.is(exact_version)) {
            var dep_pkg = name + '@' + exact_version;
            logger.warn(
              'You are trying to install an {{bold UNSTABLE}} package "' + dep_pkg + '".\n' +
              '  Be very sure to remember to publish "' + dep_pkg + '" then.'
            );
          }
          // It's great that `semver` does a awesome job on prerelease versions:
          // '1.0.0-alpha' satisfies '~1.0.0',
          // so we simply remove prerelease version before saving into field `dependencies`
          deps[name] = '~' + semver_helper.remove_prerelease(exact_version);
        });
      });

      pkg_helper.save_package(options.cwd, ctx, callback);

      // use_inherits
    }, true);

  } else {
    callback(null);
  }
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
  'save-async': 'asyncDependencies',
  'save-engine': 'engines'
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
    var package_json = data.documents[mod.name].versions[version];

    var is_git = lang.object_member_by_namespaces(package_json, "repository.type") == "git";
    var repo_url = lang.object_member_by_namespaces(package_json, "repository.url");

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

  lang.each(data.dependencies, function(versions, name) {
    var range = data.ranges[name] || {};
    Object.keys(versions).forEach(function(version) {
      packages.push({
        name: name,
        version: range[version] || version
      });
    });
  });

  return packages;
};
