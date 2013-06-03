'use strict';

var node_path     	= require('path');
var async           = require('async');
var fs              = require('fs-sync');
var Installer       = require('cortex-install');

// used by ctx.commands.build
var argv_parser     = require('../util/parse-argv');
var command_build   = require('./build');

var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// TODO:
// migrate to cortex-profile
var CORTEX_ROOT = node_path.join(USER_HOME, '.cortex');
var module_root = node_path.join(USER_HOME, '.cortex', 'modules');


function log(msg){
    process.stdout.write(msg + '\n');
};


// Attension: there will no arguments checking
// @param {Object} options:
// - modules: {Object} modules to install, ['a@1.0.1', 'b@0.0.2'];
// - save: {boolean} save cortexDependencies
// - cwd: {string} 

// @param {function()} callback
module.exports = function(options, callback){
    var modules = options.modules;
    var should_save = options.save;
    var cwd = options.cwd;

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

            installer.install(modules, function(error, data) {
                if(error){
                    throw error;
                }

                var installed_modules = [];
                var name;

                // {
                //   'a': {
                //         '0.0.1': {}
                //         '0.0.2': {}
                //      }
                // }
                for(name in data){

                    // ['a@0.0.1', 'a@0.0.2']
                    installed_modules = installed_modules.concat(
                        Object.keys(data[name]).map(function(version) {
                            return name + '@' + version;
                        })
                    );
                }
            
                done(null, installed_modules);
            });
        },

        function(installed_modules, done) {
            // build modules
            var series = [];
            var installed_module_paths = installed_modules.map(function(module_at_version) {
                return module_at_version.replace('@', node_path.sep);
            });

            installed_module_paths.forEach(function(path) {
                series.push(function(d) {

                    // mock process.argv
                    var argv = ['', '', 'build', '--cwd', node_path.join(temp_dir, path, 'package') ];
                    var parsed = argv_parser(argv);
                    
                    command_build(parsed.options, function() {
                        d();
                    });
                });
            });

            async.series(series, function() {
                done(null, installed_module_paths);
            });
        }

    ], function(err, installed_module_paths) {

        // moving folder
        installed_module_paths.forEach(function(module_slash_version) {
            fs.copy(
                node_path.join(temp_dir, module_slash_version),
                node_path.join(module_root, module_slash_version), {
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

            // TODO:
            // there is a bug:

            // case 1:
            // ctx install a b
            // a@0.0.3
            // b@0.0.1 -> ['a@0.0.2']

            // case 2:
            // ctx install a@0.0.1 b
            // b@0.0.1 -> ['a@0.0.2']

            // now we don't know which version to save to package.json
            modules.forEach(function(module) {
                var exact_version = installed_module_map[name][0];

                deps[name] = '~' + exact_version;
                exact_deps[name] = exact_version;
            });

            fs.write( package_file, JSON.stringify(pkg, null, 4) );
        }

        callback && callback();
    });
};

