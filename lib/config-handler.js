var 

fs = require('fs'),
path = require('path'),
fsmore = require('../util/fs-more'),
lang = require('../util/lang'),

REGEX_REPLACE_EXT = /^(.*)(\.[^\.]+)$/i,
REGEX_REPLACE_LEADING_TILDE = /^~/,
REGEX_IS_NODE_REQUIRE_PATH = /^(?:\.\/|\.\.\/|~\/|\/)/,


HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];


/**
 * @param {Object} options {
        cwd: {string}
        file: {string}
        parser:
        env
    }
 */
function ConfigHandler(options){
    this.cwd = options.cwd;
    this.file = options.file;
    this.env_file = this._filterConfigFile(options.file, options.env);
    
    if(options.parser){
        this._parser = options.parser;
    }
};


ConfigHandler.prototype = {
    
    // upload.json -> upload.alpha.json
    _filterConfigFile: function(file, env){
        return env ? file.replace(REGEX_REPLACE_EXT, function(all, m1, m2){
            return m1 + '.' + env + m2;
            
        }) : file;
    },
    
    _parser: function(obj){
        return obj;
    },
    
    _santitizePath: function(pathname){
    
        // '~/xxx' -> '/User/<myprofile>/'
        pathname = pathname.replace(REGEX_REPLACE_LEADING_TILDE, HOME);
        
        // 'xxx' -> './xxx'
        if(!REGEX_IS_NODE_REQUIRE_PATH.test(pathname)){
            pathname = '.' + path.sep + pathname;
        }
        
        return pathname;
    },

    getConf: function(config){
    
        config || (config = {});
    
        // get project config
        this.cwd && lang.merge(
            config, 
            this._getConfByFile(path.join(this.cwd, this.env_file), path.join(this.cwd, this.file)), 
            false
        );
        
        // get user config
        lang.merge(
            config, 
            this._getConfByFile(path.join('~', this.env_file), path.join('~', this.file)), 
            false
        );
        
        return config;
    },
    
    _getConfByFile: function(file, fallback_file){
    
        file = this._santitizePath(file);
        fallback_file = this._santitizePath(fallback_file);
    
        file = fsmore.isFile(file) ? 
              file 
            : 
              fallback_file && fsmore.isFile(fallback_file) ? fallback : false;
            
        return file ? require( file ) : {};
    }
};


module.exports = ConfigHandler;

