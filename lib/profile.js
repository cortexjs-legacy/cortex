'use strict';

// @module profile factory

var multi_profile   = require('multi-profile');
var node_path       = require('path');
var node_url        = require('url');
var fs              = require('fs-sync');
var lang            = require('./util/lang');
var code            = require('code-this');

// 1. Make sure all values saved by cortex profile is exactly correct
// 2. Make sure all values read from the config file will be examined (user may change that).

var TYPES = {
    cortex_path: {
        getter: function (v) {
            // will resolve '~' in the path
            v = multi_profile.resolveHomePath(v);

            if(!fs.isPathAbsolute(v)){

                // convert to absolute path relative to the root directory of the current profile
                v = node_path.join(this.profile.currentDir(), v);
            }

            if(!fs.isDir(v)){
                fs.mkdir(v);
            }

            return v;
        }
    },

    url: {
        setter: function (v, key, attr) {
            v = node_url.parse(String(v));

            // must be an invalid url
            if (!v.host){
                attr.error('invalid url');
            }
            
            return v.href;
        }
    }
};


var DEFAULT_OPTIONS = {
    path: '~/.cortex',

    // configuration schema and default values
    schema: {
        // cortex_root     : {
        //     value       : cortex_root,
        //     type        : TYPES.path
        // },

        module_root     : {
            writable    : false,
            value       : 'modules',
            type        : TYPES.cortex_path
        },

        builder         : {
            value       : 'neuron',
            type        : {
                validator : function (v) {
                    return typeof v === 'string' && v.trim() !== '';
                }
            }
        },

        built_root      : {
            writable    : false,
            value       : 'built_modules',
            type        : TYPES.cortex_path
        },

        built_temp      : {
            writable    : false,
            value       : 'built',
            type        : {
                getter  : function (v) {
                    v = node_path.join('.cortex', v);

                    if(!fs.isDir(v)){
                        fs.mkdir(v);
                    }

                    return v;
                }
            }
        },

        temp_root       : {
            value       : 'tmp',

            // temp_root will not be saved into profile file
            writable    : false,
            type        : {
                getter  : function (v) {
                    // will resolve '~' in the path
                    v = multi_profile.resolveHomePath(v);

                    if(!fs.isPathAbsolute(v)){

                        // convert to absolute path relative to the root directory of the current profile
                        v = node_path.join(this.profile.currentDir(), v);
                    }

                    // Everytime it returns a different directory
                    v = node_path.join(
                        v, 
                        // must be string
                        String(Date.now())
                    );

                    if(!fs.isDir(v)){
                        fs.mkdir(v);
                    }

                    return v;
                }
            }
        },

        watched         : {
            enumerable  : false,
            value       : [],
            type        : {
                setter  : function (v, key, attr) {
                    if(typeof v === 'string'){
                        v = v.split(',');

                    }else if(!Array.isArray(v)){
                        attr.error();
                    }

                    return v;
                },

                getter  : function (v) {
                    return v || [];
                }
            }
        },
        
        registry        : {
            value       : 'http://registry.ctx.io',
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
            value       : 'en',

            // Uncompleted feature, set to `writable` by now
            writable    : false
        },

        colors          : {
            value       : true,
            type        : 'boolean'
        },

        service_port    : {

            // CTX -> 074
            value       : 9074,
            type        : 'number'
        },

        workspace       : {
            value       : ''
        },

        enable_snapshot : {
            value       : true,
            type        : 'boolean'
        },

        profile_root    : {
            writable    : false,
            type        : {
                getter: function () {
                    return this.profile.currentDir();
                }
            }
        },

        username        : {
            type        : {
                validator : function (v) {
                    if(!v){
                        return;
                    }

                    if( ~ encodeURIComponent(v).indexOf('%') ){
                        return;
                    }

                    return true;
                }
            }
        },

        password        : {
        },

        email           : {
        },

        init_template   : {
            value       : 'cortex'
        }
    }
};


module.exports = function (options) {
    options = options || {};

    options.context = {};

    var profile = multi_profile(lang.mix(options, DEFAULT_OPTIONS, false));

    options.context.profile = profile;

    return profile;
};

