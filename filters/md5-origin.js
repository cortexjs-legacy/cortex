var fsMore = require("../util/fs-more"),
    fs = require("fs"),
    md5 = require("MD5"),
    child_process = require("child_process"),
    path = require("path"),
	path_mod = require("path");


/*
var base_dir = path_mod.join(__dirname,'..','res'), // 准备分析的目录
	root = path_mod.join(__dirname,'..',config.root_NAME); // 暂存文件夹
 */

module.exports = {
    _notInCortex:function(path){
        return path.indexOf(".cortex") != 0;
    },
    setup:function(done){
        this.root = this.env.build_dir; //config.cwd;
        this.data = {};
        done();
    },

    run:function(done){
        var self = this;
        fsMore.traverseDir(this.root, function(info){
            var relpath = info.relPath,
                content;

            if(info.isFile && self._notInCortex(relpath)){
                content = fs.readFileSync(info.fullPath);
                self.data["/" + relpath] = md5(content);
            }
        });
        
				var md5_origin_path = path.join(this.root,".cortex","md5-origin.json");
				fsMore.writeFileSync(md5_origin_path,JSON.stringify(this.data,null,2));
				console.log("已将未压缩文件的md5列表保存至",md5_origin_path);
        done();
    },

    tearDown:function(done){
        done();
    }

}
