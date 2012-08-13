var 

NULL = null,

/**
 
 / 
    (?:NR|DP)
    .define
    \s*
    \(
        (?:
            \s*
            (["'])
            ([a-zA-Z0-9-\/.~]+)
            \1
            \s*
            ,
        )
        \s*
 /g
 
 */
REGEX_TEST_IDENTIFIER = /(?:NR|DP).define\s*\((?:\s*(["'])([a-zA-Z0-9-\/.~]+)\1\s*,)?\s*/g,

default_config = {
    // root_dir    : NULL,
    base        : NULL, // {string}
    pkg         : NULL, // {number}
    lib_pkg     : NULL, // {number}
    db          : NULL
};


function Processor(config){
    
    // merge default configurations
    Object.keys(default_config).forEach(function(key, i){
        self[key] = config[key] || default_config[key];
    });
};


Processor.prototype = {
    isLibPkg: function(){
        return this.pkg === this.lib_pkg;
    },
    
    /**
     * @param {string|buffer} file_content
     * @param {string} path
     */
    parse: function(file_content, path){
        
        // ex: '/io/ajax.js'
        this.path = path;
        
        // ex: '/lib/1.0/io/ajax.js'
        this.fullpath = this.base + path;
        
        var m = file_content.match(REGEX_TEST_IDENTIFIER),
            changed = false;
        
        if(!m){
            console.log('warning: at least one NR.define should be used');
            return {
                changed: changed,
                passed: false
            };
        }
        
        if(m.length > 2){
            throw 'Containing more than one NR.define is forbidden: ' + this.fullpath;
        }
        
        var matched = m[1],
            replace = 'NR.define("' + this.identifier + '", ';
            
        if(matched !== replace){
            changed = file_content.replace(REGEX_TEST_IDENTIFIER, replace);
        }
        
        return {
            changed: changed,
            passed: true 
        }
    },
    
    // '/io/ajax.js' -> 'io/ajax'
    // '/index/main.js' -> 'index::main'
    get identifier(){
        var identifier = this.path.replace(/^\//, '').replace(/\.js$/, '')
        
        // app package
        if(!this.isLibPkg()){
            var split = identifier.split('/');
            
            identifier = split.shift() + ':' + split.join('/');   
        }
        
        return identifier;
    }
};


module.exports = Processor;


