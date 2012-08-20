var ActionFactory = require("./action_factory");

var Upload = ActionFactory.create("Upload")

Upload.AVAILIABLE_OPTIONS = {

};

Upload.MESSAGE = {
	USAGE:"usage: ctx upload",
	DESCRIBE:"将暂存文件夹上传到文件目录"
}

module.exports = Upload;