#!/usr/bin/env node

'use strict';

var COMMANDS = [
	'install',
	'validate',
	// 'build'
];

var cortex = module.exports = {};

cortex.commands = {};
cortex.COMMANDS = COMMANDS;

COMMANDS.forEach(function(command) {
    cortex.commands[command] = require('./command/' + command);
});