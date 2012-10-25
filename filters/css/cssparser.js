var fs = require('fs');
var tracer = require("tracer").colorConsole();
var mod_url = require('url');
var mod_path = require('path');
var mod_md5 = require('MD5');
var mod_util = require('util');





	// hosts:data.lionhosts[0], // css cdn主机列表
	// image_versions:data.imglist // 数据库图片列表

/**
 * 连接器，处理相对图片路径的各部分，将之拼装为目标格式
 * @param  {[type]} parsed {host,ext,name,version}
 * @return {String}        [description]
 */
function connector(parsed){
	var self = this,
		filelist = self.filelist,
		csspath = parsed.csspath,
		host = parsed.host,
		md5 = parsed.md5,
		ext = parsed.ext,
		name = parsed.name,
		version = parsed.version,
		ret;

	ret = "http://" + host+name+ext+"/"+md5+ext;

	return ret;
}




/**
 * @param {Object} opt
 * @param {String} opt.root css文件的根目录
 * @param {String} opt.host 绝对路径的host地址
 * @param {String} image_version 所有图片文件的结果集，参考DianPing. DP_StaticFileVersion
 */
function CssParser(opt) {
	this.root = opt.root;
	this.hosts = opt.hosts;
	this.filelist = opt.filelist;
	this.connector = opt.connector || connector;
	this._logs = [];
}

CssParser.prototype = {
	log:function(){
		this._logs.forEach(function(lg){
			console.log(lg);
		});
		this._logs = [];
	},
	clearlog:function(){
		this._logs = [];
	},
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
		var content = fs.readFileSync(mod_path.join(this.root,csspath), "utf-8");

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
		 * 涉及的所有图片路径
		 * @type {Array}
		 */
		var image_paths = [];

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
		function replaceMatch(match,i) {
			/**
			 * 匹配 url('path/to/image.png')
			 * 中的 path/to/image.png
			 */
			var reg = /\(\s*(['"]?)([\w\.\/:]+)\1\s*\)/,	
				parsed = "",
				imgpath = match.match(reg)[2],
				parsed_url;

			/**
			 * 若非相对路径则取得其相对路径进行parse
			 */
			if(!isRelative(imgpath)){
				parsed = self.calculateImagePath(csspath,imgpath,true);
			}else{
				parsed = self.calculateImagePath(csspath,imgpath,false);
			}

			image_paths.push((parsed.name+parsed.ext).substr(1));

			parsed_url = "url(" + self.connector(parsed) + ")";

			if(parsed_url !== match){
				self._logs.push(mod_util.format("%s -> %s",match,parsed_url));
				content = content.replace(match, parsed_url);;
				changed = 1;
			}
		}

		/**
		 * 数组去重
		 * @return {[type]} [description]
		 */
		function duplicate(arr){
			var ret = [];
			arr.forEach(function(item){
				if(!ret.some(function(el){
					return item == el;
				})){
					ret.push(item);
				};
			});
			return ret;
		}

		/**
		 * 循环处理所有匹配
		 */
		matches && matches.forEach(replaceMatch);

		return {
			changed: changed,
			content: content,
			image_paths:duplicate(image_paths)
		};
	},

	/**
	 * 计算CDN域名
	 * @param  {[type]} path [description]
	 * @return {[type]}      [description]
	 */
	calculateCDNHost:function(path){
		var hosts = this.hosts,
			count = hosts.length;


		return hosts[parseInt(mod_md5(path),16) % count][0];
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
	 *
	 * 若absolute为true，则忽略csspath
	 */
	calculateImagePath:function(csspath,imgpath,absolute) {
		var host,
			root,
			cssroot,
			fullpath,
			url_parsed,
			name,
			hash,
			version_match,
			real_full_path,
			reg_with_version = /([\w\/\.]+)(\.v\d+)/,
			ext;

		root = this.root;

		if(absolute){
			url_parsed = mod_url.parse(imgpath);
			fullpath = url_parsed.pathname;
			host = url_parsed.host;
		}else{
			cssroot = mod_path.dirname(csspath);
			fullpath = "/" + mod_path.join(cssroot,imgpath);
		}

		ext = mod_path.extname(fullpath);


		
		host = (host || this.calculateCDNHost(fullpath));

		name = fullpath.split(ext)[0];
		version_match = name.match(reg_with_version);

		if(version_match){
			version = version_match[2];
			name = version_match[1];
		}




		real_full_path = mod_path.join(root,fullpath);

		if(!fs.existsSync(real_full_path)){
			throw new Error("图片不存在"+fullpath);
		}

		hash = mod_md5(fs.readFileSync(real_full_path));

		return {
			csspath:csspath,
			absolute:absolute,
			host:host,
			ext:ext,
			md5:hash,
			name:name
		};
	}
}


module.exports = CssParser;