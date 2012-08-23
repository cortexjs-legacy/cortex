var tracer = require("tracer").colorConsole(),
	fsMore = require("./util/fs-more"),
	pathmod = require("path"),
	EventProxy = require("./util/event-proxy"),
	FilterEngine = require("./util/filter-engine"),
	db = require("./db"),
	config = require("./config");



filterEngine = new FilterEngine();


/**
 * 根据
 * filelist以及resource package下的rows分析出需要更新的package id
 */
function parsePackage(packages,filelist){

console.log(filelist);
	
	var pkgs = [];


	packages.forEach(function(item){
		if(filelist.some(function(filepath){
			return filepath.indexOf(item.JsPath) == 0;
		})){
			pkgs.push(item);
		}
	});

	return pkgs;
}



// 主流程

/**
 * mod:
 * zip:从zip包获取文件列表
 * txt:从txt文件获取文件列表
 */



function main(){
	var filelist = [];
	var packages; // 数据库中的package列表

	var temp_dir = pathmod.join(config.TEMP_DIR_NAME);

	var eventProxy = new EventProxy(_start);

	// 获取package列表以供分析
	eventProxy.assign("db"); 
	
	db.query("select * from CM_StaticResourcePackage",function(err,rows){
		if(err) throw err;
		packages = rows;
		eventProxy.trigger("db");
	});


	(function(){
		tracer.info("获取上线文件列表至filelist");
		fsMore.traverseDir(temp_dir,function(info){
			if(info.isFile){
				filelist.push("/" + info.relPath);
			}
		});
	})();


	function _start(){


		packages = parsePackage(packages,filelist);

		packages.forEach(function(item){

			var pkg = item.Package;
			var jsfilelist = filelist.filter(function(filepath){
				return filepath.indexOf(item.JsPath) == 0;
			});

			filterEngine.assign("css",{
				filelist:filelist, // 上线文件列表
			});
			
			/*
			filterEngine.assign("js", {
				filelist: jsfilelist,
		    	pkg:pkg
			});
 */
			filterEngine.run();
		});
	}

}


main();

module.exports = main;