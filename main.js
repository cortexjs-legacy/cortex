var filelist = require("./util/filelist"),
	allfiles = require("./allfiles"),
	CssParser = require("./parsers/css"),
	DepsParser = require("./parsers/js-deps"),
	lion = require("./util/lion"),
	config = require("./config"),
	fsmore = require("./util/fs-more"),
	db = require("./db"),
	path_mod = require("path");

// 流程控制用变量及方法
var data = {};
var steps = ["filelist","imglist"];


function removeStep(name){
	var i = steps.indexOf(name);
	if(i!==-1){
		steps.splice(i,1);
	}
	return steps;
}


function process(step,value){
	data[step] = value;
	if(removeStep(step).length > 0) return;
	start(data);
};

// 主流程

/**
 * mod:
 * zip:从zip包获取文件列表
 * txt:从txt文件获取文件列表
 */

filelist("txt",__dirname+"/filelist.txt",function(err,list){
	if(err) throw err;
	process("filelist",list);
});


db.get_all_images(function(err,rows){
	if(err) throw err;
	process("imglist",rows);
});

lion.get("key",function(err,data){
	if(err) throw err;
	process("lionhosts",data);
});

/**
 * 添加min后缀
 * @return {String} 处理过后的路径
 * @example
 * a/s/c.js -> a/s/c.min.js
 * a/s/c.v123.css -> a/s/c.v123.min.css
 */
function to_min_path(path){
	var ext = path_mod.extname(path),
		name = path.split(ext)[0];

	if(!/\.min$/.test(path)){
		name += ".min";
	}
	return name + ext;
}

function start(data){
	var parse_dir = __dirname + "/res/", // 准备分析的目录
		temp_dir = __dirname + "/" + config.TEMP_DIR_NAME, // 暂存文件夹
		allfiles_css = allfiles(parse_dir,["css"]), // 目标目录中所有css文件的相对路径
		allfiles_js = allfiles(parse_dir,["js"],true), // 目标目录中所有js文件的绝对路径
		filelist = data.filelist, // 上线文件列表
		hosts = data.lionhosts[0], // css cdn主机列表
		imglist = data.imglist; // 数据库图片列表


	var cssparser = new CssParser({base:parse_dir,hosts:hosts,image_versions:imglist});

	// 处理所有css文件，更改图片地址
	var csslist = []; // 需要刷新数据库的css列表

	allfiles_css.forEach(function(path,i){
		
		var parsed = cssparser.parse(path), // {Object} css文件的处理结果
			min_path = to_min_path(path), // {String} csspath加min
			css_in_file_list = (filelist.indexOf(path) !== -1), // {Boolean} css存在于上传文件列表中
			css_has_img_refreshed = parsed.image_paths.some(function(p){
				return filelist.indexOf(p) !== -1;
			}); // {Boolean} css中存在刷新了版本的上传文件列表中的图片文件

		// 若css中存在需要刷版本的图片或者css本身处于文件列表
		if(css_has_img_refreshed || css_in_file_list){
			// 将列表中的文件写入暂存目录
			
			fsmore.writeFileSync(temp_dir + "/" + min_path.substr(1),parsed.content);
			csslist.push(min_path);
		}
	});

	// 处理所有js文件
	// ...
	
	csslist.forEach(function(path){});

	console.log(csslist);
}





