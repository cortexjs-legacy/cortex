
var tracer = require("tracer").colorConsole(),
    fsMore = require("./util/fs-more"),
    pathmod = require("path"),
    EventProxy = require("./util/event-proxy"),
    FilterEngine = require("./util/filter-engine"),
    db = require("./db"),
    config = require("./config");


filterEngine = FilterEngine;


/**
 * 根据
 * filelist以及resource package下的rows分析出需要更新的package id
 */
function parsePackage(packages,filelist){

    tracer.info("拆分package");
    var pkgs = [];


    packages.forEach(function(item){
        if(filelist.some(function(filepath){
            return filepath.indexOf(item.JsPath) == 0;
        })){
            pkgs.push(item);
        }
    });

    return pkgs;
}



// 主流程


function _main(root){

    console.log("开始应用已配置的滤镜：");
    // packages = parsePackage(packages,filelist);

         
    var options = {
        cwd: root
    };
    
    [
        // 'publish-imitate' // ,
        'css',
        'yui-compressor'
        // 'md5-diff'
    
    ].forEach(function(filter){
        filterEngine.assign(filter, options);
    });
    
    filterEngine.run();

};


function main(root){
    db.connect(function(dbconfig){
        _main(root);
    });
}

module.exports = main;