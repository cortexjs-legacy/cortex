
var tracer = require("tracer").colorConsole(),
    fsMore = require("./util/fs-more"),
    pathmod = require("path"),
    EventProxy = require("./util/event-proxy"),
    filterEngine = require("./util/filter-engine"),
    db = require("./db"),
    config = require("./config");


// 主流程
function main(root){

    console.log("开始应用已配置的滤镜 >>>>>>>>>>");

         
    var options = {
        cwd: root
    };
    
    [
        'update',
        'publish-imitate',
        'css',
        'yui-compressor',
        'closure',
        'md5',
        'md5-diff'
    
    ].forEach(function(filter){
        filterEngine.assign(filter, options);
    });
    
    filterEngine.run();

};

module.exports = main;