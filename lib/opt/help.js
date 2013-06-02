'use strict';

exports.offset = 3;

exports.list = {
	command: {
		type: String,

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
	}
};

exports.info = 'Show help manual';

exports.usage = 'ctx help [--command <command>]\n'
	+ 'ctx help <command>';