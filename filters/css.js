var CssParser = require("./cssparser"),
	config = require("../config");
	tracer = require("tracer").colorConsole(),
	fsMore = require("../util/fs-more"),
	db = require("../db"),
    lion = require("../util/lion"),
    EventProxy = require("../util/event-proxy"),
	path_mod = require("path");




var base_dir = path_mod.join(__dirname,'..','res'), // 准备分析的目录
	temp_dir = path_mod.join(__dirname,'..',config.TEMP_DIR_NAME); // 暂存文件夹

function CssTraverser(config){
    var self = this;

    var eventproxy = this.eventproxy = new EventProxy(function(){
        self._parse.call(self);
    });

    eventproxy.assign("image_versions");
    eventproxy.assign("hosts");

    this.filelist = config.filelist;
    this.data = {};

	this.baseparser = new CssParser({
		base:base_dir,
		filelist:config.filelist
	});

	this.tempparser = new CssParser({
		base:temp_dir,
		filelist:config.filelist
	});

	this.filelist = config.filelist;
	this.temp_dir = config.temp_dir;
}



CssTraverser.prototype = {
	_isCss:function(path){
		return path_mod.extname(path) === ".css";
	},
	_isImage:function(path){
		var exts = [".png",".jpg",".gif",".bmp",".jpeg"],
			ext = path_mod.extname(path);
		return exts.indexOf(ext) !== -1;
	},
	_inFileList:function(path){
		return this.filelist.indexOf(path) !== -1;
	},
	_hasImgRefreshed:function(parsed){
		var filelist = this.filelist;

		return parsed.image_paths.some(function(p){
			return filelist.indexOf(p) !== -1;
		});
	},

	parse:function(done){
		//var jsparser = new JsParser(config);
		var self = this;

        tracer.info("获取数据库图片版本至imglist");
		db.get_all_images(function(err,data){
			err && done(err);

            tracer.info("数据库图片版本已获取");
            self.data["image_versions"] = data;
            self.eventproxy.trigger("image_versions");
		});


        tracer.info("获取lion配置至lionhosts");
        lion.get("key",function(err,data){
            err && done(err);

            tracer.info("lion hosts配置已获取");
            self.data["hosts"] = data; 
            self.eventproxy.trigger("hosts");
        });

        this._done = done;
	},
    _parse:function(){
        var self = this,
            filelist = self.filelist,
            baseparser = self.baseparser,
            tempparser = self.tempparser;

        baseparser.image_versions = tempparser.image_versions = this.data.image_versions;
        baseparser.hosts = tempparser.hosts = this.data.hosts;

        tracer.info("开始遍历上传包");
        // I.遍历上传包
        // 1. 修改css中图片相对路径
        // 2. 记录图片文件
        // II.遍历目标文件夹
        // 1. 比对未在上线列表，而包含上线图片的css，将其修改结果加入上线包
        fsMore.traverseDir(temp_dir, function(info){
            var relpath = info.relPath,
                parsed,
                css_in_file_list,
                css_has_img_refreshed;
            
            if(info.isFile && self._isCss(relpath)){
            
                parsed = tempparser.parse(relpath); // {Object} css文件的处理结果
                css_has_img_refreshed = self._hasImgRefreshed(parsed); // {Boolean} css中存在刷新了版本的上传文件列表中的图片文件

                if(parsed.changed === 1){
                    tempparser.log();
                    tracer.info("改写文件 "+temp_dir+relpath);
                    // fsMore.writeFileSync(temp_dir + relpath,parsed.content);
                }
                
            }
        });

        // 遍历线上目录
        tracer.info("开始遍历线上目录");
        fsMore.traverseDir(base_dir,function(info){
            var relpath = info.relPath,
                parsed,
                css_in_file_list,
                css_has_img_refreshed;;

            if(info.isFile && self._isCss(relpath)){
                parsed = baseparser.parse(relpath); // {Object} css文件的处理结果
                css_not_in_file_list = !self._inFileList(relpath); // {Boolean} css存在于上传文件列表中
                css_has_img_refreshed = self._hasImgRefreshed(parsed); // {Boolean} css中存在刷新了版本的上传文件列表中的图片文件

                // 若css中存在需要刷版本的图片 且 css不存在于上线列表
                if(css_has_img_refreshed && css_not_in_file_list && parsed.changed){
                    // 将列表中的文件写入暂存目录
                    baseparser.log();
                    tracer.info("改写文件 "+temp_dir+relpath);
                    // fsMore.writeFileSync(temp_dir + relpath,parsed.content);
                }else{
                    baseparser.clearlog();
                }
            }
        });

        this._done();

    },
	tearDown:function(){
		tracer.info("css遍历处理完毕");
	}
}

module.exports = CssTraverser;