var Actions = require("../actions.json");


Help = function(){
	Actions.forEach(function(name){
		if(name == "help")return;
		var action = require("../actions/"+name);
		console.log("ctx " + name);
		console.log(action.MESSAGE.USAGE);
		console.log("\t" + action.MESSAGE.DESCRIBE);
		console.log();
	});
}



module.exports = Help;