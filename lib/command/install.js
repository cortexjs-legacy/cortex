'use strict';

var install = module.exports = {};

var lang        = require('../util/lang');
var semver_helper = require('../util/semver');
var pkg_helper  = require('../util/package');
var node_path   = require('path');
var async       = require('async');
var fs          = require('fs-sync');
var spawn       = require('child_process').spawn;

// Attension: there will no arguments checking
// @param {Object} options:
// - modules: {Array.<string>} modules to install, ['a@1.0.1', 'b@0.0.2'], notice that the version of each module must be specified:
//    'a' should be 'a@latest', or there will be an failure
// - save: {boolean} save cortexDependencies
// - cwd: {string}
// - desc: {string} private property, which will never called by command-line
// - recursive: {boolean} if false, cortex will not install dependencies

// @param {function()} callback
install.run = function(options, callback) {
    if ( !options.modules.length ) {
        this.logger.warn('it seems that there\'s no packages to install.');  
        return callback(null);
    }

    options.module_root = this.context.profile.get('cache_root');

    var self = this;
    async.waterfall([
        function (done) {
            self.download_package(options, done);
        },

        function (done) {
            self.build_package(options, done);
        },

        function (done) {
            self.save_dependencies(options, done);
        },

        function (done) {
            self.clone_to_workspace(options, done);
        }

    ], callback);
};


install.download_package = function (options, callback) {
    var command_description = options.desc || 'installing';
    var modules = options.modules;

    this.logger.info('{{cyan ' + command_description + '}}', modules.join(', '));

    // suppose:
    // 1. modules -> ['a@~0.0.1', 'b@0.0.2']
    // 2. dependencies of 'b@0.0.2' -> ['~a@0.1.2']
    this.context.neuropil.install({
        modules: modules,
        dir: options.module_root,
        recursive: options.recursive,
        dependency_key: 'dependencies'

    }, function (err, data) {
        if ( err ) {
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

//     packages: {
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
install.build_package = function (options, callback) {
    // build modules
    var tasks = [];
    var commander = this.context.commander;

    this.iterate_packages(options.data, function(name, version) {
        tasks.push(function(done) {

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
                '--cwd',
                node_path.join(options.module_root, name, version, 'package')
            ];

            commander.parse(argv, function(err, result, details) {
                if (err) {
                    return done(err);
                }

                // exec cortex.commands.build method
                commander.run('build', result.opt, done);
            });
        });
    });

    async.parallel(tasks, function (err) {
        callback(err);
    });
};


install.save_dependencies = function (options, callback) {
    // save to package.json
    if (options.save || options['save-async']) {
        var data = options.data;

        pkg_helper.get_original_package(options.cwd, function (err, ctx) {
            if ( err ) {
                return callback(err);
            }

            // if --save --save-async, --save-async will be ignored
            var key = options.save ? 'dependencies' : 'asyncDependencies';

            var deps = ctx[key] || (ctx[key] = {});
            // var exact_deps = ctx.exactDependencies || (ctx.exactDependencies = {});

            Object.keys(data.origins).forEach(function(name) {
                var versions = data.origins[name];
                var ranges = data.ranges[name] || {};

                versions.forEach(function(version) {
                    var exact_version = ranges[version] || version;

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


function just_done (done) {
    done();
}

install.clone_to_workspace = function(options, callback) {
    if ( !options.clone ) {
        return callback(null);
    }

    var data = options.data;
    var modules = [];
    var mod;

    // get all origin modules from cli
    for (mod in data.origins) {
        data.origins[mod].forEach(function(v) {
            modules.push({
                name: mod,
                version: v
            });
        });
    }

    var repos = {};
    var logger = this.logger;
    var workspace = this.context.profile.get('workspace') || options.cwd;

    var tasks = modules.map(function(mod) {
        var version = data.ranges[mod.name][mod.version];
        var package_json = data.packages[mod.name].versions[version];

        var is_git = lang.object_member_by_namespaces(package_json, "repository.type") == "git";
        var repo_url = lang.object_member_by_namespaces(package_json, "repository.url");

        if (!is_git || !repo_url || repos[repo_url]) {
            return just_done;

        } else {
            repos[repo_url] = true;

            return function(done) {
                logger.info("\n{{cyan clone}}", mod.name + ':', repo_url);
                var dir = node_path.join(workspace, mod.name);

                var child = spawn("git", ["clone", repo_url, dir], {
                    stdio: "inherit"
                });

                child.on("close", function(code, signal) {
                    if ( code ) {
                        done({
                            code: 'EGITCLONE',
                            message: 'fails to git-clone "' + repo_url + '"',
                            data: {
                                repo: repo_url,
                                dir : dir
                            }
                        });
                    } else {
                        done(null);
                    }
                });
            }
        }
    });

    async.parallel(tasks, callback);
}

// @param {Object} packages
// @param {function(name, version)} callback
install.iterate_packages = function(data, callback) {
    var origins = data.origins;

    lang.each(origins, function (versions, name) {
        var range = data.ranges[name] || {};
        versions.forEach(function (version) {
            callback(name, range[version] || version);
        });
    });
};

