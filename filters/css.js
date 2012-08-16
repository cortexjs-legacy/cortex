var CssParser = require("./cssparser"),
	fsMore = require("../util/fs-more"),
	path_mod = require("path");

function CssTraverser(config){
	
	this.base = config.base;
	this.baseparser = new CssParser({
		base:config.base,
		hosts:config.hosts,
		image_versions:config.image_versions
	});
	this.tempparser = new CssParser({
		base:config.temp_dir,
		hosts:config.hosts,
		image_versions:config.image_versions
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
		var self = this,
			filelist = self.filelist,
			base_dir = self.base,
			temp_dir = self.temp_dir,
			baseparser = self.baseparser,
			tempparser = self.tempparser;

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
					fsMore.writeFileSync(temp_dir + relpath,parsed.content);
				}
				
			}
		});

		// 遍历线上目录
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
				if(css_has_img_refreshed && css_not_in_file_list){
					// 将列表中的文件写入暂存目录
					baseparser.log();
					fsMore.writeFileSync(temp_dir + relpath,parsed.content);
				}else{
					baseparser.clearlog();
				}
			}
		});

		done();
	},
	tearDown:function(){
		console.log("css traverser tear down");
	}
}

module.exports = CssTraverser;