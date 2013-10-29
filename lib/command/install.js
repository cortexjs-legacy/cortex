'use strict';

var install = module.exports = {};

var lang = require('../util/lang');
var node_path = require('path');
var async = require('async');
var fs = require('fs-sync');
var spawn = require('child_process').spawn;

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
    var modules = options.modules;
    var should_save = options.save;
    var cwd = options.cwd;

    var MODULE_ROOT = install.context.profile.get('cache_root');

    async.waterfall([
        function(done) {
            var command_description = options.desc || 'installing';

            install.logger.info('{{cyan ' + command_description + '}}', '["' + modules.join('", "') + '"]');

            // suppose:
            // 1. modules -> ['a@~0.0.1', 'b@0.0.2']
            // 2. dependencies of 'b@0.0.2' -> ['~a@0.1.2']
            install.context.neuropil.install({
                modules: modules,
                dir: MODULE_ROOT,
                recursive: options.recursive,
                dependency_key: 'cortex.exactDependencies'

            }, done);
        },


        // @type {Object} all versions including dependencies
        // {
        //     'a': {
        //         '0.0.2': {...}
        //         '0.1.2': {...}
        //     },
        //     'b': {
        //         '0.0.2': {...}
        //     }
        // }
        // X data, 

        // @type {Object} the direct version of the module to be installed
        // {'a': '0.0.1' }
        // X installed_map_without_deps

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

        function(data, done) {
            // build modules
            var series = [];
            var commander = install.context.commander;

            install.iterate_packages(data.packages, function(name, version) {
                series.push(function(sub_done) {

                    // mock process.argv
                    var argv = [
                        '', '',
                        'build',
                        '--cwd',
                        node_path.join(MODULE_ROOT, name, version, 'package')
                    ];

                    var parsed = commander.parse(argv, function(err, result, details) {
                        if (err) {
                            return sub_done(err);
                        }

                        // exec cortex.commands.build method
                        commander.run('build', result.opt, function(err) {
                            sub_done(err);
                        });
                    });
                });
            });

            async.parallel(series, function(err) {
                if (err) {
                    return done(err);
                }

                done(null, data);
            });
        }

    ], function(err, data) {
        if (err) {
            return callback(err);
        }

        // save to package.json
        if (should_save) {
            var package_file = node_path.join(cwd, 'package.json');
            var pkg = fs.readJSON(package_file);
            var ctx = pkg.cortex || (pkg.cortex = {});

            var deps = ctx.dependencies || (ctx.dependencies = {});
            // var exact_deps = ctx.exactDependencies || (ctx.exactDependencies = {});

            Object.keys(data.origins).forEach(function(name) {
                var versions = data.origins[name];
                var ranges = data.ranges[name] || {};

                versions.forEach(function(version) {
                    var exact_version = ranges[version] || version;

                    deps[name] = '~' + exact_version;
                    // exact_deps[name] = exact_version;
                });
            });

            fs.write(package_file, JSON.stringify(pkg, null, 4));
        }

        if (options.clone) {
            install.clone_to_workspace(data, function(err) {
                callback(err, data);
            });
        } else {
            callback(null, data);
        }
    });
};


install.clone_to_workspace = function(data, callback) {
    var modules = [];
    for (var mod in data.origins) {
        data.origins[mod].forEach(function(v) {
            modules.push({
                name: mod,
                version: v
            });
        });
    }

    var repos = {};

    async.parallel(modules.map(function(mod) {
        var version = data.ranges[mod.name][mod.version];
        var package_json = data.packages[mod.name].versions[version];

        var is_git = lang.object_member_by_namespaces(package_json, "repository.type") == "git";
        var repo_url = lang.object_member_by_namespaces(package_json, "repository.url");
        var workspace = install.context.profile.get('workspace');

        if (!is_git || !workspace || !repo_url || repos[repo_url]) {
            return function(done) {
                done();
            }
        } else {
            return function(done) {
                install.logger.info("\n{{cyan clone}}", mod.name + ':', repo_url);
                var child = spawn("git", ["clone", repo_url, node_path.join(workspace, mod.name)], {
                    stdio: "inherit"
                });
                child.on("close", function() {
                    done(null);
                });
            }
        }
    }), function(err) {
        callback(err, data);
    });
}

// @param {Object} packages
// @param {function(name, version)} callback
install.iterate_packages = function(packages, callback) {
    var name;
    var versions;
    var version;

    for (name in packages) {
        versions = packages[name].versions || {};

        for (version in versions) {
            callback(name, version);
        }
    }
};