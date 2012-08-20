var util = require("util");
var Action = require("./action");

ActionFactory = {
	create:function(){
		function SubAction() {
			Action.apply(this, arguments);
		}

		util.inherits(SubAction, Action);
		return SubAction;
	}
}


module.exports = ActionFactory