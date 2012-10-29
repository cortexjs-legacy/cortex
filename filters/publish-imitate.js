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
fs_more = require('../util/'),
path = require('path'),

CONFIG_FILE = 'publish.json';
 
function PrePublish(options){
    this.cwd = options.cwd;
    
    this._getConfig();
};


PrePublish.prototype = {
    run: function(){
        var 
        
        root = this._getBuildDir();
        
        (this.config.dirs || []).forEach(function(dir_setting){
            var 
            
            dir = dir_setting.dir,
            to = dir_setting.to || dir;
            
            copyFileSync(
                path.join(this.cwd, dir),
                path.join(root, to)
            );
        });
    },
    
    _getBuildDir: function(){
        return path.join(this.cwd, this.config.build_directory || 'build', 'build-' + (+ new Date));
    },
        
    _getConfig: function(){
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


exports.create = function(options){
    return new PrePublish(options);
};

