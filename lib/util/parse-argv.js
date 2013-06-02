'use strict';

var commander = require('./commander');
var fs = require('fs-sync');
var node_path = require('path');

module.exports = function(argv) {

	// argv ->
	// ['node', __dirname, '<command>', ...]
	var command;

    if(
    	// ctx -h
    	argv.indexOf('-h') !== -1 || 
    	// ctx --help
    	argv.indexOf('--help') !== -1 ||
    	// ctx
    	argv.length === 2
    ){
    	return {
    		command: 'help',
    		options: {}
    	};
    }

    command = argv[2];
    var parsed;
    var opt_rules;

    var opt_root = node_path.join( __dirname, '..', 'opt' );

    if( fs.exists( opt_root, command + '.js' ) ){
    	opt_rules = require( node_path.join( opt_root, command ) );

    }else{
    	process.stdout.write('Command <ctx ' + command + '> not found. See "ctx --help".\n');
    	process.exit(1);
    }

    return {
    	command: command,
    	options: commander.parse(argv, opt_rules)
    };

};

