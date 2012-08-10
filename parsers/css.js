var fs = require('fs');
var mod_path = require('path');

/**
 * 
 * @param  {[type]} parsed [description]
 * @return {[type]}        [description]
 */
function connector(parsed){
	var host = parsed.host,
		ext = parsed.ext,
		name = parsed.name,
		image_versions = this.image_versions || [],
		filename,
		version,
		ret;

	var reg_with_version = /([\w\/\.]+)(\.v\d+)/;

	function getVersion(path){
		var r = image_versions.filter(function(row){
			return row.URL === path;
		});

		return r[0] ? r[0]["Version"] : "";
	}

	if(reg_with_version.test(name)){
		name = name.match(reg_with_version)[1];
	}

	version = getVersion(name+ext);
	version = version ? ".v"+version : "";
	ret = host+name+version+ext;
	return ret;
}




/**
 * @param {String} base css文件的根目录
 * @param {String} host 绝对路径的host地址
 */
function CssParser(opt) {
	this.base = opt.base;
	this.host = opt.host;
	this.image_versions = opt.image_versions; // image image_versions
	this.connector = opt.connector || connector
}

CssParser.prototype = {
	/**
	 * 分析path下的所有图片路径
	 * 并将相对路径转为绝对路径
	 * @param  {String} path css文件的路径
	 * @return {Object} {changed:Boolean,content:String}
	 */
	parse: function(csspath) {
		var self = this;

		/**
		 * 获取文件内容
		 * @type {String}
		 */
		var content = fs.readFileSync(this.base + csspath, "utf-8");

		/**
		 * 匹配
		 * 1. url(a.png)
		 * 2. url('http://i1.static.dp/s/c/i/b.png')
		 * 3. url("./c.png")
		 */
		var reg = /url\(\s*(['"]?)([\w\.\/:]+)\1\s*\)/g;

		/**
		 * 用以标识文件是否有修改
		 * 有修改为1，反之为0
		 */
		var changed = 0;

		/**
		 * 返回所有匹配
		 * 例：matches[0] 为 "url(a.png)"
		 */
		var matches = content.match(reg);

		/**
		 * 判断路径是否为相对路径
		 * 例：  http://i2.static.dp/s/c/i/a.png 返回 true
		 *		c/i/a.png 返回false
		 */
		function isRelative(imgpath) {
			return !/^http:\/\//.test(imgpath);
		}

		/**
		 * 将文件content中的相对地址替换为绝对地址
		 */
		function replaceMatch(match) {
			/**
			 * 匹配 url('path/to/image.png')
			 * 中的 path/to/image.png
			 */
			var reg = /\(\s*(['"]?)([\w\.\/:]+)\1\s*\)/,	
				parsed = "",
				imgpath = match.match(reg)[2];

			/**
			 * 若非相对路径则跳过
			 */
			if (isRelative(imgpath)) {
				changed = 1;
				parsed = self.calculatePath(csspath,imgpath);
				content = content.replace(match, "url(" + self.connector(parsed) + ")");
			};
		}

		/**
		 * 循环处理所有匹配
		 */
		matches && matches.forEach(replaceMatch);

		return {
			changed: changed,
			content: content
		};
	},

	/**
	 * 计算文件的绝对路径
	 * 若:
	 * 1.当前css文件路径为 /s/c/a.css
	 * 2.host为 http://i2.static.dp
	 * 则
	 * 1. i/pic.png -> http://i2.static.dp/s/c/i/pic.png
	 * 2. ./i/pic.png -> http://i2.static.dp/s/i/pic.png
	 * 3. ../pic.png -> http://i2.static.dp/s/pic.png
	 */
	calculatePath:function(csspath,imgpath) {
		var host = this.host,
			base = mod_path.dirname(csspath),
			fullpath = "/" + mod_path.join(base,imgpath),
			ext = mod_path.extname(fullpath);

		return {
			host:host,
			ext:ext,
			name:fullpath.split(ext)[0]
		};
	}
}


module.exports = CssParser;