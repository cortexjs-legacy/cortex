/**

pubish: {
    dirs: [
        {
            dir: 'lib/',
            // to:  'lib/1.0/'
        },
        
        {
            dir: 'app/',
            to:  's/j/app/index'
        }
    ],
    
    build_directory: 'build/'
}

 */

var

fs = require('fs'),
path = require('path'),

CONFIG_FILE = 'publish.json';
 
function PrePublish(options){
    this.cwd = options.cwd;
    
};


PrePublish.prototype = {
    run: function(){
        
    },
    
    _getPublishConfig: function(){
        var
        
        content = fs.readFileSync(path.join(this.cwd, CONFIG_FILE)),
        config;
        
        try{
            config = JSON.parse(content);
        }catch(e){
            console.log('error info:', e);
            throw 'parsing publish.json failed, please check your code.';
        }
        
        return this.config = config;
    }
};


module.exports = PrePublish;

