'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var profile     = require('cortex-profile');
var lang        = require('../util/lang');

function is_empty_object(obj){
    for(var key in obj){
        return false;
    }

    return true;
};


function check_duplicate_version(modules, tools){
    var map = {};

    modules.forEach(function(module) {
        var name = module.split('@')[0];

        if( !(name in map) ){
            map[name] = true;
        
        }else{
            tools.error(
                  'With the "--save" option, '
                + 'installing more than one version of the module "' 
                + name 
                + '" is prohibited.'
            );
        }
    });
}

function check_duplicate(modules, tools){
    var map = {};

    modules.forEach(function(module) {
        if( !(module in map) ){
            map[module] = true;
        
        }else{
            tools.error('Duplicate installation of module "' + module + '".');
        }
    });
}


exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        info: 'current working directory.',
        value: process.cwd()
    },

    registry: {
        type: node_url,
        info: 'remote registry server.',
        value: profile.option('registry')
    },

    save: {
        type: Boolean,
        info: 'package will appear in your "cortex.dependencies" of package.json.',
        value: function(save, parsed, tools) {
            // if --save, package.json must exists
            if(save && !fs.exists(parsed.cwd, 'package.json')){
                return tools.error('package.json not found, could not save dependencies');
            }

            return save;
        }
    },

    modules: {

        // command line type: String
        // programmatical type: Array.<string>
        type: String,
        info: 'modules to install. if not specified, cortex will read them from your package.json. if you install a module without version, cortex will try to install the latest one.',
        value: function(modules, parsed, tools) {

            // return tool.error('just fail');

            // Object `parsed` might be a mocked argv object,
            // so, be careful, and do some tests
            var remain = parsed.argv && parsed.argv.remain || [];
            var parsed_modules;

            // > ctx install --modules ajax,lang
            if(modules){
                parsed_modules = modules.split(/\s*,\s*/);
            
            // > ctx install ajax lang
            // ['a@0.0.2'] -> {a: '0.0.2'}
            // ['a'] -> {a: 'latest'}
            }else if(remain.length){
                parsed_modules = remain;

                // .map(function(module) {
                //     module = module.split('@');

                //     var name = module[0];
                //     var version = module[1] || 'latest';

                //     return name + '@' + version;
                // });
            
            }else{
                // > ctx install
                // Read from package.json
                parsed_modules = [];
                var module_map = {};
                var package_path = node_path.join( parsed.cwd, 'package.json' );

                if( fs.exists(package_path) ){

                    // read modules from package.json
                    var pkg = fs.readJSON(package_path);
                    module_map = lang.object_member_by_namespaces(pkg, 'cortex.dependencies', {});
                }

                if( !is_empty_object(module_map) ){
                    tools.info('Read cortex.dependencies from package.json.');
                
                }else{
                    return tools.error('Please specify the modules to be installed.');
                }

                // -> ['a@0.0.2']
                Object.keys(module_map).forEach(function(name) {
                    parsed_modules.push( name + '@' + module_map[name] );
                });
            }

            // if --save, we should not install more than one version of a certain module
            parsed.save ? 
                // prohibited: a@0.0.1 a@0.0.2
                // prohibited: a a 
                // allow: a@0.0.1 b
                check_duplicate_version(parsed_modules, tools) :

                // prohibited: a a
                // allow: a@0.0.1 a@0.0.2
                check_duplicate(parsed_modules, tools);

            // 'a' -> 'a@latest'
            return parsed_modules.map(function(module) {
                var splitted = module.split('@');
                return splitted[0] + '@' + ( splitted[1] || 'latest' );
            });
        }
    }
};

exports.info = 'Install specified modules or install modules from package.json';

exports.usage = [
    '{{name}} install <module>[,<modules>[,...]]',
    '{{name}} install [options]'
];




