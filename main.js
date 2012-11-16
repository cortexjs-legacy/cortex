
var tracer = require("tracer").colorConsole(),
    fsMore = require("./util/fs-more"),
    pathmod = require("path"),
    EventProxy = require("./util/event-proxy"),
    filterEngine = require("./util/filter-engine"),
    db = require("./db"),
    config = require("./config");


// 主流程
// @param {string} root absolute path of working directory of target project
function main(root,opts){
    var filters = opts.filters && opts.filters.split(',') || [
        'update',
        'publish-imitate',
        'css',
        'yui-compressor',
        'closure',
        'md5',
        'md5-diff'
    ];
    
    console.log("开始应用已配置的滤镜 >>>>>>>>>>");
         
    var options = {
        cwd: root
    };
    
    filters.forEach(function(filter){
        filterEngine.assign(filter, options);
    });
    
    filterEngine.run();
};

module.exports = main;