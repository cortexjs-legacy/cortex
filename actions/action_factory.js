var util = require("util");
var Action = require("./action");

ActionFactory = {
	create:function(name){
		function SubAction() {
			Action.apply(this, arguments);
		}

		SubAction._name = name;
		util.inherits(SubAction, Action);
		return SubAction;
	}
}


module.exports = ActionFactory