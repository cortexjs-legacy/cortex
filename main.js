var filelist = require("./util/filelist"),
	tracer = require("tracer").colorConsole(),
	allfiles = require("./allfiles"),
	lion = require("./util/lion"),
	db = require("./db"),
	fsMore = require("./util/fs-more"),
	config = require("./config");


// 流程控制用变量及方法
var data = {};
var steps = ["lionhosts","filelist","imglist"];


function removeStep(name){
	var i = steps.indexOf(name);
	if(i!==-1){
		steps.splice(i,1);
	}
	return steps;
}


function process(step,value){
	data[step] = value;
	tracer.info("%s就绪",step);
	if(removeStep(step).length > 0) return;
	start(data);
};


// Filters驱动器
function FilterEngine(){
	this.filters = [];
}
FilterEngine.prototype = {
	assign : function(name,config){
		var Filter = require("./filters/"+name);
		var filter = new Filter(config);
		this.filters.push({name:name,filter:filter});
	},
	run:function(){
		var self = this;
		this.filters.forEach(function(mod){
			var filter = mod.filter;
			
			/**
			 * @type {Object} status {
			         passed: {boolean}
			         msg: {string}
			     }
			 */
			filter.parse && filter.parse(function(err){
    			if(err){
    			     throw error;
    			 }else{
        			 self.done(mod.name);
    			}
    			
			});
		});
	},
	
	done: function(name){
		
	},
	
	_check: function(){
	    
	},
	
	_teardown: function(){
	    
	}
}	

filterEngine = new FilterEngine();


// 主流程

/**
 * mod:
 * zip:从zip包获取文件列表
 * txt:从txt文件获取文件列表
 */

/*
filelist("txt",__dirname+"/filelist.txt",function(err,list){
	if(err) throw err;
	process("filelist",list);
});
*/

var base_dir = __dirname + "/res/", // 准备分析的目录
	temp_dir = __dirname + "/" + config.TEMP_DIR_NAME + "/"; // 暂存文件夹
	
function main(){

	(function(){
		var filelist = [];
		tracer.info("获取上线文件列表至filelist");
		fsMore.traverseDir(temp_dir,function(info){
			if(info.isFile){
				filelist.push(info.relPath);
			}
		});
		process("filelist",filelist);
	})();

	tracer.info("获取数据库图片版本至imglist");
	db.get_all_images(function(err,rows){
		if(err) throw err;
		process("imglist",rows);
	});

	tracer.info("获取lion配置至lionhosts");
	lion.get("key",function(err,data){
		if(err) throw new Error(err);
		process("lionhosts",data);
	});
}


module.exports = main;


function start(data){
	tracer.info(data.filelist);
	filterEngine.assign("css",{
		temp_dir:temp_dir,
		base:base_dir,
		hosts:data.lionhosts[0], // css cdn主机列表
		filelist:data.filelist, // 上线文件列表
		image_versions:data.imglist // 数据库图片列表
	});
	
	filterEngine.assign("js", {
    	filelist: data.filelist
	});

	filterEngine.run();
}
