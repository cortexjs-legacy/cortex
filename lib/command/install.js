'use strict';

var install         = module.exports = {};

var node_path       = require('path');
var async           = require('async');
var fs              = require('fs-sync');


// Attension: there will no arguments checking
// @param {Object} options:
// - modules: {Array.<string>} modules to install, ['a@1.0.1', 'b@0.0.2'], notice that the version of each module must be specified:
//    'a' should be 'a@latest', or there will be an failure
// - save: {boolean} save cortexDependencies
// - cwd: {string}

// @param {function()} callback
install.run = function(options, callback){
    var modules = options.modules;
    var should_save = options.save;
    var cwd = options.cwd;

    var MODULE_ROOT = install.context.profile.option('module_root');

    async.waterfall([
        function(done) {
            install.logger.info('{{cyan installing}}', '["' + modules.join('", "') + '"]');

            // suppose:
            // 1. modules -> ['a@~0.0.1', 'b@0.0.2']
            // 2. dependencies of 'b@0.0.2' -> ['~a@0.1.2']
            install.context.neuropil.install({
                modules: modules,
                dir: MODULE_ROOT,
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

            install.iterate_packages(data.packages, function (name, version) {
                series.push(function(sub_done) {

                    // mock process.argv
                    var argv = [
                        '', '', 
                        'build', 
                        '--cwd', 
                        node_path.join(MODULE_ROOT, name, version, 'package') 
                    ];

                    var parsed = commander.parse(argv);
                    
                    // exec cortex.commands.build method
                    commander.run('build', parsed.options.parsed, function(err) {
                        sub_done(err);
                    });
                });
            });

            async.parallel(series, function(err) {
                if(err){
                    return done(err);
                }

                done(null, data);
            });
        }

    ], function(err, data) {
        if(err){
            return callback(err);
        }

        // save to package.json
        if(should_save){
            var package_file = node_path.join(cwd, 'package.json');
            var pkg = fs.readJSON(package_file);
            var ctx = pkg.cortex || (pkg.cortex = {});

            var deps = ctx.dependencies || (ctx.dependencies = {});
            var exact_deps = ctx.exactDependencies || (ctx.exactDependencies = {});

            Object.keys(data.origins).forEach(function(name) {
                var versions = data.origins[name];
                var ranges = data.ranges[name] || {};

                versions.forEach(function (version) {
                    var exact_version = ranges[version] || version;

                    deps[name] = '~' + exact_version;
                    exact_deps[name] = exact_version;
                });
            });

            fs.write( package_file, JSON.stringify(pkg, null, 4) );
        }

        callback(null, data);
    });
};


// @param {Object} packages
// @param {function(name, version)} callback
install.iterate_packages = function (packages, callback) {
    var name;
    var versions;
    var version;

    for(name in packages){
        versions = packages[name];

        for(version in versions){
            callback(name, version);
        }
    }  
};

