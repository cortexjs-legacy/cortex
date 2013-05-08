var npm = require("./npmw");

var versionValidator = {
	exist:function(moduleName,version,cb){
		//cb会接受到1个参数，boolean exist
		npm.load(function(){
			npm.commands.view([moduleName+"@"+version],true,function(error,data){
				console.log(arguments);
				if(!error && data[version]){
					cb(true);
				}else{
					cb(false);
				}
			});
			
		});

	}
}
exports = module.exports = versionValidator;
