var ActionFactory = require("./action_factory");


var Package = ActionFactory.create();


Package.prototype.run = function() {
	var opts = this.options;

	console.log(this.options);
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