'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var get_pkg     = require('../util/package').get_package_json;


// Check if the modules to be updated is included in "dependencies"
function map_modules (modules, pkg, tools){
    var dependencies = pkg.dependencies;

    if(!dependencies){
        tools.error('Nothing to update.');
        return;
    }

    return modules.map(function (key) {
        if(key in dependencies){
            return key + '@' + dependencies[key];
        
        }else{
            tools.error('"' + key + '" is not a dependency.' );
        }
    });
};


// Check if the modules have no version
function check_module_names (modules, tools){
    return modules.every(function (key) {
        if(! ~ key.indexOf('@') ){
            return true;

        }else{
            tools.error('The modules to be updated should have no versions: "' + key + '".');
        }
    });
};


exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        value: process.cwd(),
        info: 'specify the current working directory.'
    },

    modules: {
        type: String,
        info: 'the name(s) of the module(s) to be updated.',

        // cortex update --modules jquery,angularjs
        // cortex update
        // cortex update jquery

        // @returns {Array.<string>} ATTENSION!
        value: function(modules, parsed, tools) {
            var result = get_pkg(parsed.cwd);

            if(result.err){
                return tools.error(result.err);
            }

            var cortex = result.cortex;

            if(!modules){
                var remain = parsed.argv.remain;

                // cortex update jquery angularjs
                if( remain.length ){
                    modules = remain;

                }else{
                    modules = Object.keys(cortex.dependencies || {});
                }
            
            // cortex update --modules jquery,angularjs
            }else if(typeof modules === 'string'){
                modules = modules.split(',');
            }

            if(!modules.length){
                return tools.error('Nothing to update.');
            }

            // forbidden: cortex update jquery@1.9.2
            if( !check_module_names(modules, tools) ){
                return;
            }

            // jquery -> jquery@~0.9.2
            return map_modules(modules, cortex, tools);
        }
    }
};

exports.info = 'Update the dependencies of a specific package.';

exports.usage = [
    '{{name}} update --modules [dep][,dep][,dep]...',
    '{{name}} update [dep] [dep]...'
];
