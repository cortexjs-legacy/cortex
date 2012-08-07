/*
	mod:allfile
	author:spud hsu
	last-update:2012-08-01
	description:输入根目录，输出目录下所有符合扩展名的文件路径
	usage:
	allfiles("path",["js","css"]);
	
	return ["path/a.js","path/inc/b.js","path/inc/c.css"];	

*/

var fs = require('fs'),
		path = require('path');

function is_dir(dir){
	return fs.statSync(dir).isDirectory();
}

function allfile(dir,exts,arr,entry){
	if(!is_dir(dir)){
		console.error(dir+" is not a directory!");
		return false;
	}
	
	if(!exts || !exts.length){
		console.error("please specify extension types!");
		return false;
	}
	
	if(dir.lastIndexOf("/") !== dir.length-1 ){
		console.log(dir.lastIndexOf("/")+dir)
		dir = dir + "/";
	}	
	
	exts = exts.constructor === Array ? exts: [exts];

	arr = arr || [];
	var files = fs.readdirSync(dir);
	
	files.forEach(function(file_path){
		var fullpath = dir + file_path;
		var ext = path.extname(file_path).split(".")[1]||"";
		if(exts.indexOf(ext)!==-1){
			arr.push(fullpath);
		}
		if(is_dir(fullpath)){
			allfile(fullpath,exts,arr,1);
		}
	});	

	return arr;

}

module.exports = allfile;
