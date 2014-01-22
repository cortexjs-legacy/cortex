'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var lang        = require('../util/lang');
var pkg_helper  = require('../util/package');

function is_empty_object(obj){
    for(var key in obj){
        return false;
    }

    return true;
};


// There should be no duplicate modules.
// There should be no duplicate versions of a same module
function check_duplicate_version(done, modules, cwd){
    var map = {};

    pkg_helper.get_original_package(cwd, function (err, pkg) {
        if ( err ) {
            return done(err);
        }

        var pkg_name = pkg.name;

        modules.forEach(function(module) {
            var name = module.split('@')[0];

            if(pkg_name === name){
                done('You should not install a module "' + name + '" into itself.');

            }else if( !(name in map) ){
                map[name] = true;
            
            }else{
                done(
                      'With the "--save" option, '
                    + 'installing more than one version of the module "' 
                    + name 
                    + '" is prohibited.'
                );
            }
        });

        done(null);
    });
}

// There should be no duplicate modules.
function check_duplicate(done, modules){
    var map = {};

    modules.forEach(function(module) {
        if( !(module in map) ){
            map[module] = true;
        
        }else{
            done('Duplicate installation of module "' + module + '".');
        }
    });

    done(null);
}


function save_check_package (save) {
    var done = this.async();

    // if --save, package.json must exists
    if(save){
        var cwd = pkg_helper.repo_root( this.get('cwd') );

        // 'cortex install' might be called inside a subtle directory of the project.
        if(cwd === null){
            return done('package.json not found, could not save dependencies');
        }

        this.set('cwd', cwd);
    }

    done(null);
}


exports.shorthands = {
    c: 'cwd',
    r: 'recursive'
};

exports.options = {
    recursive: {
        type: Boolean,
        info: 'install all dependencies recursively. If `false`, cortex will only download the current module.',
        default: true
    },

    cwd: {
        type: node_path,
        info: 'current working directory.',
        // `cortex install` could be executed anywhere
        default: process.cwd()
    },

    // if --save --save-async, --save-async will be ignored
    save: {
        type: Boolean,
        info: 'package will appear in your "cortex.dependencies" of package.json.',
        validator: save_check_package
    },

    'save-async': {
        type: Boolean,
        info: 'package will appear in your "cortex.asyncDependencies" of package.json.',
        validator: save_check_package
    },

    clone: {
        type: Boolean,
        info: 'try to clone the package repo down to the workspace.',
        default: false
    },

    modules: {

        // command line type: String
        // programmatical type: Array.<string>
        info: 'modules to install. if not specified, cortex will read them from your package.json. if you install a module without version, cortex will try to install the latest one.',
        setter: function(modules) {
            var done = this.async();

            exports._get_modules({
                remain  : this.get('_') || [],
                cwd     : this.get('cwd'),
                save    : this.get('save') || this.get('save-async'),
                modules : modules

            }, done);

        
            //     var parsed_modules;

                

            //     function check_done (err){
            //         if ( err ) {
            //             done(err);

            //         } else {
            //             done(
            //                 null, 
            //                 // 'a' -> 'a@latest'
            //                 parsed_modules.map(function(module) {
            //                     var splitted = module.split('@');
            //                     return splitted[0] + '@' + ( splitted[1] || 'latest' );
            //                 })
            //             );
            //         }
            //     };

            //     // if --save, we should not install more than one version of a certain module
            //     save ? 
            //         // prohibited: a@0.0.1 a@0.0.2
            //         // prohibited: a a 
            //         // allow: a@0.0.1 b
            //         check_duplicate_version.call(this, check_done, parsed_modules, cwd) :

            //         // prohibited: a a
            //         // allow: a@0.0.1 a@0.0.2
            //         check_duplicate.call(this, check_done, parsed_modules);
            // });

            
        }
    }
};


exports._get_pkg = function (cwd, callback) {
    pkg_helper.get_original_package(cwd, callback);
};


// @param {Object} options
// - pkg
// - cwd
// - save
// - remain
exports._get_modules = function (options, callback) {
    var parsed_modules = [];

    // Invalid value
    // ```
    // cortex install --modules
    // ```
    if( options.modules === true ){
        return callback({
            code: 'EINVALID',
            message: 'invalid value of option --modules, which must be specified.',
            data: {
                option: 'modules'
            }
        });
    }

    // 1. 
    // Install modules which explicitly defined in option --modules
    // ```
    // #　could be executed anywhere
    // cortex install --modules ajax,lang
    // ```
    if ( options.modules ) {
        parsed_modules = options.modules.split(/\s*,\s*/);
    }

    // 2. 
    // Install modules in argv.remain
    // ```
    // #　could be executed anywhere
    // cortex install ajax lang
    // ```

    // Object `remain` might be a mocked argv object,
    // so, be careful, and do some tests
    if( options.remain.length ){
        parsed_modules = options.remain;
    }
    
    // 3. 
    // Install modules from dependencies of package.json, 
    // ```
    // # in this case, must executed inside a repo
    // cortex install
    // ```
    if (
        // if --save or --save-async,
        // there must inside a repo, or we will not be able to save dependencies
        !options.save &&  
        parsed_modules.length
    ) {
        return callback(null, parsed_modules);
    }

    var cwd = pkg_helper.repo_root(options.cwd);

    if ( cwd === null ) {
        if ( options.save ) {
            return callback({
                code: 'ECOULDNOTSAVE',
                message: 'Directory "' + cwd + '" is not inside a repo, could not save dependencies.',
                data: {
                    cwd: cwd
                }
            });
            
        } else {
            return callback({
                code: 'ENOTAREPO',
                message: 'Directory "' + cwd + '" is not inside a repo, could not fetch dependencies.',
                data: {
                    cwd: cwd
                }
            });
        }
    }


    if ( true ) {
        
    }


    if( fs.exists(package_path) ){

        // read modules from package.json
        var pkg = fs.readJSON(package_path);
        module_map = lang.object_member_by_namespaces(pkg, 'cortex.dependencies', {});
    }

    if( !is_empty_object(module_map) ){
        this.context.logger.info('Read cortex.dependencies from package.json.');
    
    }else{
        return done('Please specify the modules to be installed.');
    }

    // -> ['a@0.0.2']
    Object.keys(module_map).forEach(function(name) {
        parsed_modules.push( name + '@' + module_map[name] );
    });
};


exports.info = 'Install specified modules or install modules from package.json';

exports.usage = [
    '{{name}} install <module>[,<modules>[,...]]',
    '{{name}} install [options]'
];




