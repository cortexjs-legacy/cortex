var fsMore = require("../util/fs-more"),
    async = require("async"),
    child_process = require("child_process"),
	path_mod = require("path");


/*
var base_dir = path_mod.join(__dirname,'..','res'), // 准备分析的目录
	root = path_mod.join(__dirname,'..',config.root_NAME); // 暂存文件夹
 */


function ClosureTraverser(config){
}



ClosureTraverser.prototype = {
    _isJs:function(path){
        return path_mod.extname(path) === ".js";
    },

    _isNotMin:function(path){
        return !/\.min\.js$/.test(path);
    },

    _makeMinPath:function(path){
        return path.replace(/\.js$/,".min.js");
    },

    setup:function(done){
        this.root = this.env.build_dir;
        this.project_base = path_mod.join(__dirname,"..");
        done();
    },

    run:function(done){
        var self = this,
            root = self.root;
        
        var tasks = [];

        fsMore.traverseDir(root, function(info){
            var relpath = info.relPath,
                parsed,
                css_in_file_list;
            
            if(info.isFile && self._isJs(relpath) && self._isNotMin(relpath)){
                tasks.push(function(done){
                    var dir = path_mod.join(self.project_base,'tools','closure','compiler.jar');
                        path = info.fullPath,
                        minpath = self._makeMinPath(path);

                    var command = "java -jar " + dir + " --compilation_level SIMPLE_OPTIMIZATIONS --charset UTF-8 --js " + path + " --js_output_file " + minpath;


                    child_process.exec(command,function(err){
                        if(err){
                            done(err);
                            return;
                        }else{
                            done(null);
                        }
                    });
                });

            }
        });

        async.series(tasks,function(err){
            if(err){
                throw new Error(err);
            }

            console.log("js压缩完成");
            done();
        });
    },

	tearDown:function(done){
		console.log("js压缩处理完毕");
        done();
	}
}

module.exports = {
    create:function(config){
        return new ClosureTraverser(config);
    }
};