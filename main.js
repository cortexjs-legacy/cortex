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
    var filelist = [];
    var packages; // 数据库中的package列表


    var temp_dir = pathmod.join(config.TEMP_DIR_NAME);

    // var eventProxy = new EventProxy(_start);

    // 获取package列表以供分析
    
    //现在不获取db啦
    // eventProxy.assign("db"); 
    
    /*
    
    db.query("select * from CM_StaticResourcePackage",function(err,rows){
        if(err) throw new Error(err);
        packages = rows;
        tracer.info("已获取所有静态资源包");
        eventProxy.trigger("db");
    });

     */
    

    (function(){
        tracer.info("获取上线文件列表");
        fsMore.traverseDir(root,function(info){
            if(info.isFile){
                filelist.push("/" + info.relPath);
            }
        });
        console.log("已获取\n" + filelist.join("\n"));
        _start();
    })();


    function _start(){

        tracer.info("开始处理");
        // packages = parsePackage(packages,filelist);

        if(!filelist.length){
            tracer.info("没有需要处理的包");
            process.exit();
        }else{
            /*
                var jsfilelist = filelist.filter(function(filepath){
                    return filepath.indexOf(item.JsPath) == 0;
                });
            */
            
            var options = {
                cwd: root
            };
            
            [
                'publish-imitate',
                'css',
                'md5-diff'
            
            ].forEach(function(filter){
                filterEngine.assign(filter, options);
            });
            
            filterEngine.run();
        }
    }

}


function main(root){
    db.connect(function(dbconfig){
        _main(root);
    });
}

module.exports = main;