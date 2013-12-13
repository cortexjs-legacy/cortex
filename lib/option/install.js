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
    var result = pkg_helper.get_package_json(cwd);

    if(result.err){
        return done(result.err);
    }

    var pkg = result.pkg;

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
        default: process.cwd()
    },

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
        type: String,
        info: 'modules to install. if not specified, cortex will read them from your package.json. if you install a module without version, cortex will try to install the latest one.',
        setter: function(modules) {
            var done = this.async();

            // return tool.error('just fail');

            // Object `remain` might be a mocked argv object,
            // so, be careful, and do some tests
            var remain = this.get('_') || [];
            var cwd = this.get('cwd');
            var save = this.get('save') || this.get('save-async');

            var parsed_modules;

            // > ctx install --modules ajax,lang
            if(modules){
                parsed_modules = modules.split(/\s*,\s*/);
            
            // > ctx install ajax lang
            // ['a@0.0.2'] -> {a: '0.0.2'}
            // ['a'] -> {a: 'latest'}
            }else if(remain.length){
                parsed_modules = remain;
            
            }else{
                // > ctx install
                // Read from package.json
                parsed_modules = [];
                var module_map = {};
                var package_path = node_path.join( cwd, 'package.json' );

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
            }

            function check_done (err){
                if ( err ) {
                    done(err);

                } else {
                    done(
                        null, 
                        // 'a' -> 'a@latest'
                        parsed_modules.map(function(module) {
                            var splitted = module.split('@');
                            return splitted[0] + '@' + ( splitted[1] || 'latest' );
                        })
                    );
                }
            };

            // if --save, we should not install more than one version of a certain module
            save ? 
                // prohibited: a@0.0.1 a@0.0.2
                // prohibited: a a 
                // allow: a@0.0.1 b
                check_duplicate_version.call(this, check_done, parsed_modules, cwd) :

                // prohibited: a a
                // allow: a@0.0.1 a@0.0.2
                check_duplicate.call(this, check_done, parsed_modules);
        }
    }
};

exports.info = 'Install specified modules or install modules from package.json';

exports.usage = [
    '{{name}} install <module>[,<modules>[,...]]',
    '{{name}} install [options]'
];




