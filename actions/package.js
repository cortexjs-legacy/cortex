var ActionFactory = require("./action_factory");
var config = require("../config");
var main = require("../main");
var path = require("path");

var Package = ActionFactory.create("Package");


Package.prototype.run = function() {
    var opts = this.options,
        mods = this.modules,
        root = mods[0];

    main(root || process.cwd());
};

Package.MESSAGE = {
    USAGE: "usage: ctx package root",
    DESCRIBE: "从指定目录打包静态文件"
};


module.exports = Package;