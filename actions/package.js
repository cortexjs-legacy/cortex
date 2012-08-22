var ActionFactory = require("./action_factory");
var config = require("../config")
var zipper = require("../util/zipper"); 
var main = require("../main");

var Package = ActionFactory.create("Package");


Package.prototype.run = function() {
	var opts = this.options,
		filename;

	if(opts.zip){
		filename = opts.zip;

		zipper.unzip(filename,config.TEMP_DIR_NAME,function(err,data){
			if(err){
				throw new Error(err);
			}

			main();

		});
	}else if(opts.list){

	}
};


Package.AVAILIABLE_OPTIONS = {
	zip:{
		alias:["-z","--zip"],
		description:"package from a zip file",
		length:1
	},
	list:{
		alias:["-l","--list"],
		description:"package from a txt file list",
		length:1
	}
};

Package.MESSAGE = {
	USAGE:"usage: ctx package [option] file",
	DESCRIBE:"从zip包 或 文件列表 打包发布"
}


module.exports = Package;