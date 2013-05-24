#! /usr/bin/env node

// sub command, just like a standalone program
var program = require("commander")
    , npmw = require("../lib/npmw")
    , path = require("path")
    , file = require("fs-extra")
    , color = require("colors")
    , async = require("async")
    , cwd = process.cwd()
    , WEB_MODULE_DIR = "web_modules"
    , NODE_MODULE_DIR = "node_modules"
    , PACKAGE_DEPENDENCIES_KEY = "cortexDependencies";

function removeEmptyDir(path){
    if(!file.existsSync(path)){
        return;
    }

    var files = file.readdirSync(path);
    if(!files.length){
        file.removeSync(path)
    }
}

function installModule(mod,version,done){
    npmw.load(function (er,npm) {
        if (er) return done(er)
        npm.commands.install([mod+"@"+version], function (er, data) {
            if (er) return done(er)
            done(null);
        });
    });
}

/**
 * 分析依赖，下载
 */
function intstallDependencies(dir,all_installed){
    var packageFile = path.join(dir,"./package.json")
        , packageJSON = file.readJsonSync(packageFile)
        , dependencies
        , mod
        , tasks = [];

    dependencies = packageJSON[PACKAGE_DEPENDENCIES_KEY]
    if(!dependencies){
        all_installed()
        return;
    }

    for(mod in dependencies){
        (function(mod,version){
            tasks.push(function(one_installed){
                installModule(mod,version,function(){
                    var node_modules_dir = path.join(cwd,NODE_MODULE_DIR)
                        , web_modules_dir = path.join(cwd,WEB_MODULE_DIR)
                        , module_preinstalled_dir = path.join(node_modules_dir,mod)
                        , module_dist_dir = path.join(web_modules_dir,mod,version)

                    file.mkdirpSync(module_dist_dir);
                    file.copy(module_preinstalled_dir,module_dist_dir,function(){
                        intstallDependencies(module_dist_dir,one_installed);
                        console.log("copy: ".green + path.relative(cwd,module_preinstalled_dir) + " -> " + path.relative(cwd,module_dist_dir))
                        file.removeSync(module_preinstalled_dir);
                    });
                });
            });
        })(mod,dependencies[mod]);
    }
    async.series(tasks,all_installed);


}


if(require.main) {
    intstallDependencies(cwd,function(err){
        if(err){
            console.log("err: ".red + err)
            process.exit(1);
        }
        removeEmptyDir(path.join(cwd,NODE_MODULE_DIR));
        console.log("info: ".green +"all dependencies installed");
    });

}
