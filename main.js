var filelist = require("./filelist"),
	allfiles = require("./allfiles"),
	cssparser = require("./parsers/css"),
	depsparser = require("./parsers/js");

// 流程控制用变量及方法
var data = {};
var steps = ["filelist"];


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

filelist("txt","filelist",function(err,list){
	if(err) throw err;

	process("filelist",list);
});


function start(data){

}





