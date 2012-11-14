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
    
    // build_directory: 'build/'
}

 */

var

fs = require('fs'),
tracer = require("tracer").colorConsole(),
fs_more = require('../util/fs-more'),
path = require('path'),
CORTEX_DIR = '.cortex',
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
        
        build_dirs = this._getBuildDir()
        build_dir = build_dirs.full,
        build_rel_dir = build_dirs.rel;
        
        fs.writeFileSync(path.join(this.cwd, CORTEX_DIR, 'latest-pack'), path.join('build', build_rel_dir));
        
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
        var rel_dir = 'build-' + (+ new Date);
    
        return {
            full: path.join(this.cwd, CORTEX_DIR, 'build', rel_dir),
            rel: rel_dir
        };
    },

    _getConfig: function(){
        console.log('读取配置信息 (publish.json) ...');
    
        var
        
        content = fs.readFileSync(path.join(this.cwd, CORTEX_DIR, CONFIG_FILE)),
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

