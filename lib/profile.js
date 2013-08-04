'use strict';

var multi_profile = require('multi-profile');
var node_path = require('path');
var node_url = require('url');
var fs = require('fs-sync');

var cortex_root = multi_profile.resolvePath('~/.cortex');

var TYPES = {
    path: {
        setter: function (v, key, attr) {

            // will resolve '~' in the path
            return profile.resolvePath(v);
        }
    },

    url: {
        setter: function (v, key, attr) {
            v = url.parse(String(v));

            if (!v.host){
                attr.error('invalid url');
            }
            
            return v.href;
        }
    }
};


var profile = module.exports = multi_profile({
    path: '~/.cortex',

    // configuration schema and default values
    schema: {
        cortex_root     : {
            value       : cortex_root,
            type        : TYPES.path
        },

        module_root     : {
            value       : node_path.join(cortex_root, 'modules'),
            type        : TYPES.path
        },

        built_root      : {
            value       : node_path.join(cortex_root, 'built_modules'),
            type        : TYPES.path
        },

        built_temp      : {

            // could be relative path
            value       : node_path.join('.cortex', 'built')
        },

        temp_root       : {
            value       : node_path.join(cortex_root, 'tmp'),

            // temp_root will not be saved into profile file
            readOnly    : true,
            type        : {

                // It's only a getter, and everytime it returns a different directory
                getter  : function (v) {
                    return node_path.join(v, Date.now());
                }
            }
        },
        
        registry        : {
            value       : 'http://registry.npmjs.org',
            type        : TYPES.url
        },

        registry_port   : {
            value       : 80,
            type        : {
                validator : function (v) {
                    return typeof v === 'string'
                }
            }
        },

        server_path     : {
            value       : '/mod',
            type        : {

                // 'mod' -> '/mod'
                getter  : function (v) {
                    return '/' + v.replace(/^\/+|\/+$/, '');
                }
            }
        },

        language        : {
            value       : 'en'
        }
    }
});

