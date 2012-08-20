var util = require("util");
/**
 * Action基类
 */


function Action(args){
	var self = this;

	var AVAILIABLE_OPTIONS = this.constructor.AVAILIABLE_OPTIONS;


	this.options = this._parseArgs(args,AVAILIABLE_OPTIONS);
	
}


/**
 * parse:a b c -zip as asd asd -l asd as 
 * zip:{zip:{alias:["-z","--zip"],length:1}},
 * list:{alias:["-l","--list"],length:1}
 *
 * to: {zip:as,list:asd}
 */
Action.prototype._parseArgs = function(args,availiables){
	var i = 0,
		l = args.length;

	var options = {};

	for(; i < l ; i++ ){
		var arg = args[i];

		if(arg.charAt(0) !== "-"){
			continue;
		}

		var optname;
		for(var key in availiables){
			var alias = availiables[key].alias || [];
			if(alias.indexOf(arg) !== -1){
				optname = key;
				break;
			}
		}

		if(!optname){
			continue;
		}

		var optlen = availiables[optname].length || 0;

		if(optlen == 0){
			options[optname] = true
		}else{
			options[optname] = [];
			while(optlen--){
				i++;
				if(!args[i]){
					throw new Error(util.format("Arguments for option %s not enough",optname));
				}
				options[optname].push(args[i]);
			}
		}
	}

	return options;
}



Action.prototype.run = function(){
	throw new Error("please implements your own run function in sub class.");
}

module.exports = Action;