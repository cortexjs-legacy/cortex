'use strict';

var node_path       = require('path');
var async           = require('async');
var fs              = require('fs-sync');
var Installer       = require('cortex-install');
var profile         = require('cortex-profile');
var commander       = require('../commander');
var logger          = require('../logger');
var command_build   = require('./build');

function log(msg){
    process.stdout.write(msg + '\n');
};


// Attension: there will no arguments checking
// @param {Object} options:
// - modules: {Object} modules to install, ['a@1.0.1', 'b@0.0.2'], notice that the version of each module must be specified:
//    'a' should be 'a@latest'
// - save: {boolean} save cortexDependencies
// - cwd: {string} 

// @param {function()} callback
module.exports = function(options, callback){
    var modules = options.modules;
    var should_save = options.save;
    var cwd = options.cwd;
    var CORTEX_ROOT = profile.option('cortex_root');
    var MODULE_ROOT = profile.option('module_root');

    // 
    var temp_dir = node_path.join(CORTEX_ROOT, 'tmp', + new Date + '');

    var installer = new Installer({

        // install modules into a temporary directory
        dir : temp_dir,
        key : "cortexDependencies",
        registry : options.registry
    });

    async.waterfall([
        function(done) {
            log('Installing: ["' + modules.join('", "') + '"]');

            // suppose:
            // 1. modules -> ['a@0.0.1', 'b@0.0.2']
            // 2. dependencies of 'b@0.0.2' -> ['a@0.0.2']
            installer.install(modules, function(
                error, 

                // @type {Object} all versions including dependencies
                // {
                //     'a': {
                //         '0.0.1': {...}
                //         '0.0.2': {...}
                //     },
                //     'b': {
                //         '0.0.2': {...}
                //     }
                // }
                data, 

                // @type {Object} the direct version of the module to be installed
                // { 'a': '0.0.1' }
                installed_map_without_deps
            ) {
                if(error){
                    throw error;
                }

                var installed_modules = [];
                var name;

                for(name in data){

                    // ['a@0.0.1', 'a@0.0.2']
                    installed_modules = installed_modules.concat(
                        Object.keys(data[name]).map(function(version) {
                            return name + '@' + version;
                        })
                    );
                }
            
                done(null, installed_modules, installed_map_without_deps);
            });
        },

        function(installed_modules, installed_map_without_deps, done) {
            // build modules
            var series = [];
            var installed_module_paths = installed_modules.map(function(module_at_version) {
                return module_at_version.replace('@', node_path.sep);
            });

            installed_module_paths.forEach(function(path) {
                series.push(function(d) {

                    // mock process.argv
                    var argv = ['', '', 'build', '--cwd', node_path.join(temp_dir, path, 'package') ];
                    var parsed = commander.parse(argv);
                    
                    // exec cortex.commands.build method
                    command_build(parsed.options, function() {
                        d();
                    });
                });
            });

            async.parallel(series, function() {
                done(null, installed_module_paths, installed_map_without_deps);
            });
        }

    ], function(err, installed_module_paths, installed_map_without_deps) {

        // moving folder
        installed_module_paths.forEach(function(module_slash_version) {
            fs.copy(
                node_path.join(temp_dir, module_slash_version),
                node_path.join(MODULE_ROOT, module_slash_version), {
                    force: true
                }
            );
        });

        // remove temp_dir
        fs.delete(temp_dir);

        // save to package.json
        if(should_save){
            var package_file = node_path.join(cwd, 'package.json');
            var pkg = fs.readJSON(package_file);

            var deps = pkg.cortexDependencies || (pkg.cortexDependencies = {});
            var exact_deps = pkg.cortexExactDependencies || (pkg.cortexExactDependencies = {});

            Object.keys(installed_map_without_deps).forEach(function(name) {
                var exact_version = installed_map_without_deps[name];

                deps[name] = '~' + exact_version;
                exact_deps[name] = exact_version;
            });

            fs.write( package_file, JSON.stringify(pkg, null, 4) );
        }

        callback && callback();
    });
};

