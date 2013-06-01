#!/usr/bin/env node

'use strict';

var cortex = require('../');
var fs = require('fs-sync');
var node_path = require('path');

var argv = process.argv;

var option_list = {
	help: {
		short: 'h',
		type: Boolean
	},

	list: {
		short: 'l',
		type: Boolean
	}
};


var parsed = option(option_list, argv, 2);

var command;
var config = {};

// ctx --help
// ctx -h
// ctx
if(parsed.help || argv.length === 2){
	command = 'help';

// ctx --help --list
// ctx --list
// ctx -l
}else if(parsed.list){
	command = 'help';
	config.list = true;

// ctx <command>
}else{
	command = argv[2];
}

var lib_root = node_path.join( __dirname, '..', 'lib', 'cli');

if ( !fs.exists( cli_root, command + '.js' ) ) {
    process.stdout.write('Command <ctx ' + command + '> not found. See "ctx --help".\n');
    process.exit(1);
}

// run command
require( node_path.join( cli_root, command ) ).run(config);

