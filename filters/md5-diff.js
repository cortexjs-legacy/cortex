/**
 
 
 
 */

var

SUCCESS_LOCK_FILE = 'success.lock',
MD5_FILE = 'md5.json',
CONFIG_DIR = '.cortex',
CONFIG_FILE = 'publish.json',

fs = require('fs'),
fs_more = require('../util/fs-more'),
tracer = require("tracer").colorConsole(),
path = require('path');


/**
 * @param {Object} params {
    project_root: {string}
 }
 */
function Diff(options){
    this.cwd = options.cwd;
};


Diff.prototype = {
    
    /**
     * @param {function()} callback will be executed when completed
     */
    run: function(callback){
        this._prepareData();
    
        var
        
        pathname,
        cur_md5, last_md5;
        
        try{
            pathname = path.join(this.cur_build_root, CONFIG_DIR, MD5_FILE);
            cur_md5 = JSON.parse( fs.readFileSync(pathname) );
        
        }catch(e){
            console.log(e);
            tracer.error( '分析 ' + pathname + '时出错，请检查你的代码' );
            throw 'error!';
        }
        
        if(this.last_build_root){
            try{
                pathname = path.join(this.last_build_root, CONFIG_DIR, MD5_FILE);
                last_md5 = JSON.parse( fs.readFileSync(pathname) );
            
            }catch(e){
                console.log(e);
                tracer.error( '分析 ' + pathname + '时出错，请检查你的代码' );
                throw 'error!';
            }
        }
        
        var
        
        diff = this._diff(cur_md5, last_md5 || {});
        
        this._writeList(diff);
        
        callback();
    },
    
    _diff: function(list, rel_list){
        var url,
            result = {};
        
        for(url in list){
            if(list[url] !== rel_list[url]){
                result[url] = list[url];
            }
        }
        
        return result;
    },
    
    _writeList: function(list){
        fs.writeFileSync( path.join(this.cur_build_root, CONFIG_DIR, 'filelist.json' ), JSON.stringify(list));
    },
    
    _prepareData: function(){
        this._getBuildRoot();
    
        var
        
        build_dirs = this._getSortedBuildDirs();
        
        if(!build_dirs.length){
            tracer.error( '没有发现包文件夹，形如：build-<timestamp>/' );
            throw 'error!';
        }
        
        
        this.cur_build_root = path.join(this.build_root, build_dirs.shift());
        
        var 
        i = 0,
        len = build_dirs.length,
        dir,
        last_build_dir;
        
        for(; i < len; i ++){
            dir = build_dirs[i];
            
            if(
                // there must be a 'success.lock' file at the last successfull build directory
                fs_more.isFile(
                    path.join(dir, CONFIG_DIR, SUCCESS_LOCK_FILE)
                )
            ){
                last_build_dir = dir;
                break;
            }
        }
        
        this.last_build_root = !!last_build_dir ? path.join(this.build_root, last_build_dir) : false;
        
    },
    
    _getBuildRoot: function(){
        return this.build_root = path.join(this.cwd, CONFIG_DIR, 'build');
    },
    
    _getSortedBuildDirs: function(){
        var 
        
        root = this.build_root,
        dir_content = fs.readdirSync(root);
    
        return dir_content.filter(function(current){
            return fs_more.isDirectory(path.join(root, current));
            
        }).sort(function(a, b){
            return a < b;
        });
    }
};


module.exports = {
    
    // factory
    create: function(params){
        return new Diff(params);
    }
};