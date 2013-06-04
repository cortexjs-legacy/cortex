'use strict';

exports.offset = 3;

exports.list = {
	command: {
		type: String,
		info: 'specify which command to show help',

		// ctx help --command build
		// ctx help build
		value: function(command, parsed) {
		    if(!command){

		    	// ctx help build
		    	// 1   2    3
		    	command = parsed.argv.remain[0];
		    }

		    return command || 

		    	// show all command
		    	'*';
		}
	},

	detail: {
		type: Boolean,
		info: 'whether show detail help information',

		// ctx help build
		// -> ctx help --command build --detail
		value: function(list, parsed) {
		    return parsed.command === '*' ? 
		    	// if show all command, show quick help
		    	false : 
		    	list === false ? 

		    		// ctx help build --no-detail
		    		// -> detail: false
		    		false : 

		    		// ctx help build			-> detail: undefined
		    		// ctx help build --detail  -> detail: true
		    		// -> detail: true
		    		true;
		}
	}
};

exports.info = 'Show help manual';

exports.usage = [
	'ctx help [--command <command>]',
	'ctx help <command>'
];
