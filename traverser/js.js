/**
 
 1. 更新列表中的所有静态文件
 
 -> 将列表中静态文件分类：pkg + sub-list
 
 
 2. 更新某 package 中的所有静态文件
 
 -> 遍历 package 中所有静态文件：pkg + all-file-list
 
 param:
    - force update: 即使文件没有修改，也强制更新版本号？ -> 放到单独的逻辑中来处理？
  
 */

var 

TEMP_DIR_NAME = '__cortex_tmp',

Processor = require('../parsers/js-processor'),
deps = require('../parsers/js-deps'),
spawn = require('child_process').spawn,
path = require('path'),
fs = require('fs'),
fsMore = require('../util/fs-more'),
db = require('../db'),
config = require('../config');


/*
traverser(parseRoot, function(data){
    var content = fs.readFileSync(data.fullPath);

    console.log('deps', deps(content));
    console.log();
    console.log(processor.parse(content, data));
    
    console.log('-----------------')
});
*/


function JsTraverser(config){

    //////////////////////////////////////////////////////////////////////////////////////////
    // ad-hoc parameters, which should read from db
    config = {
        pkg: 100,
        libPkg: 100,
        jsPath: '/lib/1.0'
    };
    //////////////////////////////////////////////////////////////////////////////////////////

    this.processor = new Processor(config);
    
    // should changed after cortex finished
    this.parseRoot = path.join(__dirname, '../res', config.jsPath);
    this.tempRoot = this.parseRoot + '/' + TEMP_DIR_NAME;
    
    this._queries = [];
};

JsTraverser.prototype = {
    _checkTempFolder: function(){
        var passed = true;
        
        if(!fs.existsSync(this.tempRoot) || !fs.statSync(this.tempRoot).isDirectory()){
            fs.mkdirSync(this.tempRoot); 
        }
        
        
    },
    
    parse: function(){
        
    },
    
    /**
     * exec all db queries after all things done
     * copy files
     * empty temp folders
     */
    postProcess: function(){
        
    }
};


module.exports = JsTraverser;




