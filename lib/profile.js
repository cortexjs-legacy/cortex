'use strict';

// @module profile factory

var multi_profile   = require('multi-profile');
var node_path       = require('path');
var node_url        = require('url');
var fs              = require('fs-sync');
var lang            = require('./util/lang');
var tmp             = require('./util/tmp');

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

// ================================================================
// FLAGS:
// writable -> false    : you can't save the data into your hardware
// enumerable -> false  : the key will not be listed, but you can get it directly 
// ================================================================

var DEFAULT_OPTIONS = {
    path: '~/.cortex',

    // configuration schema and default values
    schema: {
        // cortex_root     : {
        //     value       : cortex_root,
        //     type        : TYPES.path
        // },

        cache_root     : {
            // internal value for cortex, which should be changed by user
            writable    : false,
            enumerable  : false,
            value       : 'modules',
            type        : TYPES.cortex_path
        },

        built_root      : {
            // internal value for cortex
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

        temp_dir        : {
            value       : 'tmp',

            // internal value for cortex
            // temp_root will not be saved into profile file
            writable    : false,
            enumerable  : false,
            type        : {
                getter  : function (v) {
                    // will resolve '~' in the path
                    v = multi_profile.resolveHomePath(v);

                    if(!fs.isPathAbsolute(v)){

                        // convert to absolute path relative to the root directory of the current profile
                        v = node_path.join(this.profile.currentDir(), v);
                    }

                    return tmp.dir(v);
                }
            }
        },

        watched         : {
            // should not be set by user, it will not be listed, but could be saved
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

            // Uncompleted feature, set to `non-writable` by now temporarily
            writable    : false,
            enumerable  : false
        },

        // commonjs builder, such as 'requirejs', 'neuron'
        builder         : {
            value       : 'neuron',
            type        : {
                validator : function (v) {
                    return typeof v === 'string' && v.trim() !== '';
                }
            }
        },

        // whether cortex should print colored output.
        // set 'colors' to `false` on CI
        colors          : {
            value       : true,
            type        : 'boolean'
        },

        // http port for cortex server
        service_port    : {
            // CTX -> 074
            value       : 9074,
            type        : 'number'
        },

        workspace       : {
            value       : 'workspace',
            type        : TYPES.cortex_path
        },

        // enable SNAPSHOT versioning
        enable_snapshot : {
            value       : true,
            type        : 'boolean'
        },

        profile_root    : {
            // readonly, and should not changed by user
            writable    : false,
            enumerable  : false,
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
                },

                getter: function (v, key, attr) {
                    // if user edit the config file, there will be a value
                    if ( v ) {
                        return v;
                    }

                    var auth = attr.get('_auth');

                    if ( auth ) {
                        return auth_decode(auth).username;
                    }
                }
            }
        },

        password        : {
            type        : {
                getter  : function (v, key, attr) {
                    // if user edit the config file, there will be a value
                    if ( v ) {
                        return v;
                    }

                    var auth = attr.get('_auth');

                    if ( auth ) {
                        return auth_decode(auth).password;
                    }
                }
            }
        },

        email           : {
            type        : {
                validator: function (v) {
                    return !!v;
                }
            }
        },

        init_template   : {
            value       : 'cortex'
        },

        // tell cortex, whether your working environment has http cache,
        // if `true`, cortex will not allow override an existing document path
        http_cache       : {
            value       : false,
            type        : 'boolean'
        },

        _auth           : {
            enumerable  : false,
            type        : {
                setter  : function (v, key, attr) {
                    return auth_encode(attr.get('username'), attr.get('password')) || v;
                }
            }
        }
    }
};


function auth_encode (username, password) {
    return username && password ?
        new Buffer(username + ':' + password, 'utf8').toString('base64') :
        undefined;
}


function auth_decode (auth) {
    auth = auth ?
        new Buffer(auth, 'base64').toString('utf8').split(':') :
        [];

    return {
        username: auth[0],
        password: auth[1]
    };
}


module.exports = function (options) {
    options = options || {};

    options.context = {};

    var profile = multi_profile(lang.mix(options, DEFAULT_OPTIONS, false));

    options.context.profile = profile;

    profile.saveConfig = function () {
        profile.set('_auth');
        var data = profile.getWritable();

        // never save username and password
        delete data.password;
        delete data.username;

        profile.save(data);
    };

    return profile;
};

