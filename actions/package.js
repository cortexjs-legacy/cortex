var ActionFactory = require("./action_factory");
var config = require("../config");
var main = require("../main");
var path = require("path");

var Package = ActionFactory.create("Package");

Package.AVAILIABLE_OPTIONS = {
	filters:{
		alias:["-f","--filter"],
		length:1,
		description:"可选过滤器：update,publish-imitate,css,js,yui-compressor,closure,md5,md5-diff"
	}
};


Package.prototype.run = function() {
    var opts = this.options,
        mods = this.modules,
        root = mods[0];


    main(root || process.cwd(),opts);
};


Package.MESSAGE = {
    USAGE: "usage: ctx package <root> [options]\n例:usage: ctx package -f update,publish-imitate,css,js",
    DESCRIBE: "从指定目录打包静态文件"
};


module.exports = Package;