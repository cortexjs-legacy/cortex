/**
 
 1. 更新列表中的所有静态文件
 
 -> 将列表中静态文件分类：pkg + sub-list
 
 
 2. 更新某 package 中的所有静态文件
 
 -> 遍历 package 中所有静态文件：pkg + all-file-list
 
 param:
    - force update: 即使文件没有修改，也强制更新版本号？ -> 放到单独的逻辑中来处理？
  
 */

var 

STR_APP_SPLITTER = '::',

REGEX_RELATIVE_APP_PREFIX = /^~\//,

Processor = require('./js-processor'),
deps = require('./js-deps'),
spawn = require('child_process').spawn,
path = require('path'),
fs = require('fs'),
fsMore = require('../util/fs-more'),
db = require('../db'),
config = require('../config');


/**
 * substitute
 * @param {string} template
 * @param {Object} params
 */
function substitute(template, params){
    
    // suppose:
    // template = 'abc{a}\\{b}';
    // params = { a: 1, b: 2 };
    
    // returns: 'abc1{b}'
    return ('' + template).replace(/\\?\{([^{}]+)\}/g, function(match, name){ // name -> match group 1
    
        // never substitute escaped braces `\\{}`
        // '\\{b}' -> '{b}'
        return match.charAt(0) === '\\' ? match.slice(1)
            :
                // '{a}' -> '1'
                ( params[name] != null ? params[name] : '');
    });
};


function JsTraverser(config){

    //////////////////////////////////////////////////////////////////////////////////////////
    // ad-hoc parameters, which should read from db
    config = {
        pkg: 0,
        libPkg: 100,
        jsPath: '/s/j/app/',
        libJsPath: '/lib/1.0',
        list: []
    };
    
    var STATIC_ROOT = path.join(__dirname, '../res');
    //////////////////////////////////////////////////////////////////////////////////////////

    this.processor = new Processor(config);
    
    this.config = config;
    
    // should changed after cortex finished
    
    // this.parseRoot = path.join(STATIC_ROOT, config.jsPath);
    this.parseRoot = STATIC_ROOT;
    this.tempRoot = this.parseRoot + '/' + config.TEMP_DIR_NAME;
    
    this.filelist = this._filterList(config.list);
    
    this._jsFiles = [];
};

JsTraverser.prototype = {
    _checkTempFolder: function(){
        var passed = true;
        
        if(!fsMore.isDirectory(this.tempRoot)){
            fs.mkdirSync(this.tempRoot);
        }
    },
    
    _filterList: function(list){
        var jsPath = this.config.jsPath;
    
        return list.filter(function(file){
            return file.indexOf(jsPath) === 0;
        });
    },
    
    
    // '/s/j/app/promo/index.js' -> 'promo'
    _getAppName: function(file){
        return file.replace(this.config.jsPath + '/', '').split('/')[0].toLowerCase();
    },
    
    parse: function(){
        var self = this,
            config = self.config,
            processor = new Processor({
                pkg: config.pkg,
                libPkg: config.libPkg
            });
    
        self._checkTempFolder();
        
        // for details,
        // filelist contains a set of urls like:
        // '/lib/1.0/io/ajax'
        self.filelist.forEach(function(file){
            if(self._checkFile(file)){
            
                
                var content = fs.readFileSync(self.tempRoot + file);
                
                // dependencies
                var info = {
                        deps: deps(content),
                        path: file
                    }
                    
                if(!self.isLibPkg()){
                    info.appName = self._getAppName(file);
                }
            
                self._jsFiles.push(info);
                
                // preprocess
                var result = processor.parse(content, {
                        pkgPath: self._getPkgPath(file),
                        path: file
                    });
                  
                if(result.passed && result.changed){
                    var fd = fs.openSync(file, 'w+');
                    
                    fs.writeSync(fd, result.changed);
                }  
                
            }
        });
    },
    
    isLibPkg: function(){
        var config = this.config;
        
        return config.pkg === config.libPkg;    
    },
    
    /**
     * path -> '/lib/2.0/io/ajax.js'
     * @returns {boolean} true if the file is ok, or successfully moved the related file into the temp directory
     */
    _checkFile: function(relPath){
        
        return fsMore.isFile(this.tempRoot + relPath) || this._moveToTempDir(relPath);
    },
    
    /**
     * 
     */
    _moveToTempDir: function(relPath){
        if(fsMore.isFile(this.parseRoot + relPath)){
        
            // remove leading `/`
            fsMore.moveFileSync(this.parseRoot + relPath, this.tempRoot + relPath);
        
            return true;
        }
        
        return false;
    },
    
    /**
     * exec all db queries after all things done
     * copy files
     * empty temp folders
     */
    tearDown: function(){
        this._updateDeps();
    },
    
    /**
     * update database CM_jsDependency
     */
    _updateDeps: function(){
        var DB_NAME = config.DB_DEPENDENCY,
            self = this,
            config = self.config;
        
        self._jsFiles.forEach(function(js){
            
            db.query(substitute('DELETE * FROM {DB_NAME} WHERE URL = {url} AND Package = {pkg}', {
                DB_NAME: DB_NAME,
                url: js.path,
                pkg: config.pkg
            }));
            
            // Each dependency creates a record
            js.deps.forEach(function(dep){
                dep = self._santitizeDep(dep, js);
                
                if(!dep){
                    return;
                }
            
                db.query(substitute(
                    'INSERT INTO {DB_NAME} (URL, Package, ParentURL, ParentPackage) VALUES ({url}, {pkg}, {parent_url}, {parent_pkg})', {
                    DB_NAME: DB_NAME,
                    url: js.path,
                    pkg: config.pkg,
                    parent_url: dep.path,
                    parent_pkg: dep.pkg
                }));
            });
            
        });
    },
    
    
    /**
     * @param {string} dep
     * @param {Object} context context info
     */
    _santitizeDep: function(dep, context_info){
        var self = this,
            is_app_pattern = dep.indexOf(STR_APP_SPLITTER) !== -1,
            dep_path,
            dep_pkg;
        
        if(self.isLibPkg() && is_app_pattern){
            return false;
        }
        
        // convert the url of each dependency to standard format
        if(is_app_pattern){
            var split = dep.split(STR_APP_SPLITTER);
        
            // 'promo::index' -> '/s/j/app' + '/' + 'promo/index'
            dep_path = self.jsPath + '/' + split.join('/');
        
        }else if(REGEX_RELATIVE_APP_PREFIX.test(dep)){

            // '~/index/locmap' -> '/s/j/app' + '/' + 'index/locmap'
            dep_path = self.jsPath + '/' + context_info.appName + '/' + dep.replace(REGEX_RELATIVE_APP_PREFIX, '');
            dep_pkg
            
        }else if(self._isRelativeURL(dep)){
        
            // './jsonp'
            dep_path = path.join(context_info.path, dep);
        
        }else{
        
            // 'io/jsonp'
            dep_path = self.libJsPath + '/' + dep;
            dep_pkg = self.libPkg;
        }
        
        return {
            pkg: dep_pkg || self.pkg,
            path: dep_path + '.js'
        }
        
    },
    
    _isRelativeURL: function(url){
        return url.indexOf('../') || url.indexOf('./');
    },
    
    _getPkgPath: function(url){
        return url.replace(this.jsPath).replace(/~\//);
    }
    
};


module.exports = JsTraverser;




