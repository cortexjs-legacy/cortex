var CssParser = require("./cssparser"),
	config = require("../../config"),
	fsMore = require("../../util/fs-more"),
	db = require("../../db"),
    lion = require("../../util/lion"),
    EventProxy = require("../../util/event-proxy"),
	path_mod = require("path");


/*
var base_dir = path_mod.join(__dirname,'..','res'), // 准备分析的目录
	root = path_mod.join(__dirname,'..',config.root_NAME); // 暂存文件夹
 */


function CssTraverser(config){
    this.data = {};
}



CssTraverser.prototype = {
	_isCss:function(path){
		return path_mod.extname(path) === ".css";
	},

    _isNotMin:function(path){
        return !/\.min\.css$/.test(path);
    },

	_isImage:function(path){
		var exts = [".png",".jpg",".gif",".bmp",".jpeg"],
			ext = path_mod.extname(path);
		return exts.indexOf(ext) !== -1;
	},
	_inFileList:function(path){
		return this.filelist.indexOf(path) !== -1;
	},
    setup:function(done){
        console.log("prepare css");
        var self = this;
        var eventproxy = this.eventproxy = new EventProxy(function(){
            done();
        });

        this.root = this.env.build_dir;

        eventproxy.assign("hosts");

        lion.get("dp-common-web.imgResourceServer",function(err,data){
            err && done(err);
            try{
                data = JSON.parse(data);
            }catch(e){}
            console.log("lion hosts配置已获取");
            self.data["hosts"] = data; 
            eventproxy.trigger("hosts");
        });

    },

    run:function(done){
        var self = this,
            root = self.root,
            parser = new CssParser({
                root:root,
                hosts:this.data.hosts
            });

        // I.遍历上传包
        // 1. 修改css中图片相对路径
        // 2. 记录图片文件
        // II.遍历目标文件夹
        // 1. 比对未在上线列表，而包含上线图片的css，将其修改结果加入上线包
        fsMore.traverseDir(root, function(info){
            var relpath = info.relPath,
                parsed,
                css_in_file_list;
            
            if(info.isFile && self._isCss(relpath)){
            
                parsed = parser.parse(relpath); // {Object} css文件的处理结果
                
                parser.log();
                console.log("改写文件 ",root,relpath);
                fsMore.writeFileSync( path_mod.join(root,relpath),parsed.content);
            }
        });
        done();
    },

	tearDown:function(done){
		console.log("css遍历处理完毕");
        done();
	}
}

module.exports = {
    create:function(config){
        return new CssTraverser(config);
    }
};