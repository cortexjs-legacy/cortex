'use strict';


var cortex = module.exports = {};

var COMMANDS = cortex.COMMANDS = [
    'install',
    'validate',
    'build',
    'help'
];

cortex.commands = {};
cortex.opts = {};

COMMANDS.forEach(function(command) {

    // cortex.commands[command](options)
    cortex.commands[command] = require('./command/' + command).run;
    cortex.opts[command] = require('./opt/' + command);
});

cortex.commander = require('./commander');
cortex.logger = require('./logger');

