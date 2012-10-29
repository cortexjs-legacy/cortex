/**
 
 
 
 */

var

TEMP_DIR = '.cortex',
SUCCESS_LOCK_FILE = 'success.lock',
MD5_FILE = 'md5.json',

fs = require('fs'),
fs_more = require('../util/fs-more'),
path = require('path');


/**
 * @param {Object} params {
    project_root: {string}
 }
 */
function Diff(options){
    this.cwd = options.cwd;
    
    this._getConfig();
    this._prepareData(params);
};


Diff.prototype = {
    setup: function(){
        
    },
    
    /**
     * @param {function()} callback will be executed when completed
     */
    run: function(callback){
        var
        
        pathname;
        cur_md5, last_md5;
        
        try{
            pathname = path.join(this.cur_build_root, TEMP_DIR, MD5_FILE);
            cur_md5 = JSON.parse( fs.readFileSync(pathname) );
        
        }catch(e){
            console.log(e);
            throw 'error parsing: ' + pathname;
        }
        
        if(this.last_build_root){
            try{
                pathname = path.join(this.last_build_root, TEMP_DIR, MD5_FILE);
                last_md5 = JSON.parse( fs.readFileSync(pathname) );
            
            }catch(e){
                console.log(e);
                throw 'error parsing: ' + pathname;
            }
        }
        
        var
        
        diff = this._diff(cur_md5, last_md5 || {});
        
        this._writeList(diff);
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
        var
        
        fd = fs.openSync( path.join(this.cur_build_root, TEMP_DIR );
        fs.writeSync(fd, JSON.stringify(list));
        fs.closeSync(fd);
    },
    
    _prepareData: function(params){
        this._getBuildRoot();
    
        var
        
        build_dirs = this._getSortedBuildDirs();
        
        if(!build_dirs.length){
            throw 'no build directory found, there should be a directory like: build-<timestamp>'
        }
        
        
        this.cur_build_root = path.join(this.cwd, this.build_root, build_dirs.shift());
        
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
                    path.join(this.cwd, this.build_root, dir, TEMP_DIR, SUCCESS_LOCK_FILE)
                )
            ){
                last_build_dir = dir;
                break;
            }
        }
        
        this.last_build_root = !!last_build_dir ? path.join(this.cwd, this.build_root, last_build_dir) : false;
        
    },
    
    _getBuildRoot: function(){
        return this.build_root = path.join(this.cwd, this.config.build_directory || 'build');
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


module.exports = {
    
    // factory
    create: function(params){
        return new Diff(params);
    }
};