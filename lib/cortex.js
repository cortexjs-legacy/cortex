'use strict';


var cortex = module.exports = {};

var COMMANDS = cortex.COMMANDS = [
	'install',
	'validate',
	'build',
];

cortex.commands = {};
cortex.opts = {};

COMMANDS.forEach(function(command) {

	// cortex.commands[command](options)
    cortex.commands[command] = require('./command/' + command);
    cortex.opts[command] = require('./opt/' + command);
});

cortex.commander = require('./util/commander');

cortex.parse_argv = require('./util/parse-argv');





// run command line
// cortex.cli(command)