var 

fs = require('fs'),
path = require('path'),
fsmore = require('../util/fs-more'),
lang = require('../util/lang'),

REGEX_REPLACE_EXT = /^(.*)(\.[^\.]+)$/i;


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
    this.excludes = options.excludes || [];
    
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
    
        file = fsmore.stdPath(file);
        fallback_file = fsmore.stdPath(fallback_file);
    
        var fileconf = fsmore.isFile(file) ? require(file) : {};
        var fallback_fileconf = fsmore.isFile(fallback_file) ? require(fallback_file) : {};

        var conf = lang.merge(fallback_fileconf,fileconf);

        this.excludes.forEach(function(ex){
            delete conf[ex];
        });
        
        return conf;
    }
};


module.exports = ConfigHandler;

