var tracer = require("tracer").colorConsole(),
	fsMore = require("./util/fs-more"),
	pathmod = require("path"),
	EventProxy = require("./util/event-proxy"),
	FilterEngine = require("./util/filter-engine"),
	config = require("./config");



filterEngine = new FilterEngine();



// 主流程

/**
 * mod:
 * zip:从zip包获取文件列表
 * txt:从txt文件获取文件列表
 */

function main(){
	var filelist = [];
	var temp_dir = pathmod.join(config.TEMP_DIR_NAME);

	var eventProxy = new EventProxy();


	eventProxy.assign("db");
	

	(function(){
		tracer.info("获取上线文件列表至filelist");
		fsMore.traverseDir(temp_dir,function(info){
			if(info.isFile){
				filelist.push(info.relPath);
			}
		});
	})();



	filterEngine.assign("css",{
		filelist:filelist, // 上线文件列表
	});
	
	filterEngine.assign("js", {
    	filelist: filelist
	});

	filterEngine.run();

}


main();

module.exports = main;