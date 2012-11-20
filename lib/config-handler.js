var 

fs = require('fs'),
fsmore = require('fs-more'),
path = require('path'),
lang = require('lang'),

REGEX_REPLACE_EXT = /^(.*)(\.[^\.]+)$/i;


/**
 * @param {Object} options {
        cwd: {string}
        configFile: {string}
        parser
    }
 */
function ConfigHandler(options){
    this.cwd = options.cwd;
    this.file = options.configFile
    this.env_file = this._filterConfigFile(options.configFile, options.env);
    
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

    getConfig: function(config){
    
        // get project config
        this.cwd && lang.merge(
            config, 
            this._getConfigByFile(path.join(this.cwd, this.env_file), path.join(this.cwd, this.file)), 
            false
        );
        
        // get user config
        lang.merge(
            config, 
            this._getConfigByFile(path.join('~', this.env_file), path.join('~', this.file)), 
            false
        );
        
        return config;
    },
    
    _getConfigByFile: function(file, fallback_file){
        file = fsmore.isFile(file) ? file : 
            fallback_file && fsmore.isFile(fallback_file) ? fallback : false
            : false;
            
        return file ? this._parser(
            JSON.parse( fs.readFileSync(file) )
        ) : {};
        
    }
};



