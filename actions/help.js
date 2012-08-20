var Actions = require("../actions.json");
var ActionFactory = require("./action_factory");
var util = require("util");

Help = ActionFactory.create("Help");

Help.prototype.run = function(){
	var ctx = require("../bin/cortex");

	var mods = this.modules;
	var mod;
	if(!mods.length){
		Actions.forEach(function(name){
			var msg = getHelp(ctx[name]);
			msg && console.log(msg);
		});
	}else{
		mod = ctx[mods[0]];

		if(!mod){
			console.log("unknown action: "+mods[0]);
		}else{
			msg = getHelp(mod,true);
			msg && console.log(msg);	
		}
	}
}

function getHelp(action,verbose){
	var name = action._name,
		msg;
	if(name == "Help")return;

	msg = util.format("ctx %s\n%s\n       %s\n",
		name.toLowerCase(),
		action.MESSAGE.USAGE,
		action.MESSAGE.DESCRIBE
	);

	if(verbose){
		var opts = action.AVAILIABLE_OPTIONS;
		var alias;

		msg += "\n";
		for(var key in opts){
			alias = opts[key].alias.join(",");
			msg += "       " + opts[key].alias + remainSpaces(16,alias) + opts[key].description + "\n";
		}
	}
	return msg;
}

function remainSpaces(num,left){
	var ret = '',
		len = left.length;

	for(var i = num ; i > len ; i--){
		ret += ' ';
	}

	return ret;
}

module.exports = Help;