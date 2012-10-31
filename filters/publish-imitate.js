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
tracer = require("tracer").colorConsole(),
fs_more = require('../util/fs-more'),
path = require('path'),

CONFIG_FILE = 'publish.json';
 
function PrePublish(options){
    this.cwd = options.cwd;
};


PrePublish.prototype = {
    run: function(callback){
        console.log('预打包开始...');
        
        this._getConfig();
    
        var 
        
        self = this,
        
        build_dir = this._getBuildDir();
        
        this.env.build_dir = build_dir;
        
        (this.config.dirs || []).forEach(function(dir_setting){
            var 
            
            dir = dir_setting.dir,
            to = dir_setting.to || dir;
            
            console.log('正在将 ' + path.join(self.cwd, dir) + '/ 目录复制到 ' + path.join(build_dir, to) + '/');
            
            fs_more.copyDirSync(
                path.join(self.cwd, dir),
                path.join(build_dir, to)
            );
        });
        
        callback();
    },
    
    _getBuildDir: function(){
        return path.join(this.cwd, this.config.build_directory || 'build', 'build-' + (+ new Date));
    },
        
    _getConfig: function(){
        console.log('读取配置信息 (publish.json) ...');
    
        var
        
        content = fs.readFileSync(path.join(this.cwd, CONFIG_FILE)),
        config;
        
        try{
            config = JSON.parse(content);
        }catch(e){
            tracer.error('分析 publish.json 时出错, 请检查你的代码', e);
            throw 'error!';
        }
        
        return this.config = config;
    }
};


exports.create = function(options){
    return new PrePublish(options);
};

