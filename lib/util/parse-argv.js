'use strict';

var commander = require('./commander');
var fs = require('fs-sync');
var node_path = require('path');

var opt_root = node_path.join( __dirname, '..', 'opt' );

function check_command_exists(command) {
    if( !fs.exists( opt_root, command + '.js' ) ){
        process.stdout.write('ctx: "' + command + '" is not a cortex command. See "ctx --help".\n');
        process.exit(1);
    }
}


module.exports = function(argv) {

	// argv ->
	// ['node', __dirname, '<command>', ...]
	var command;
    
    var index_h = argv.indexOf('-h');
    var index_help = argv.indexOf('--help');

    // 'help' command need special treatment
    if(
    	// ctx -h
    	index_h > 0 || 
    	// ctx --help
    	index_help > 0 ||
    	// ctx
    	argv.length === 2
    ){
        // 1   2       3
        // ctx install -h
        // ctx install --help 
        // -> ctx help --command install --no-detail
        var help_command = index_h !== 2 && index_help !== 2 && argv[2];

        help_command && check_command_exists(help_command);

    	return {
    		command: 'help',
    		options: {

                // ctx
                // -> ctx help --command * --no-detail
                command: help_command || '*'

                // detai: false 
            }
    	};
    
    // normal command
    }else{
        command = argv[2];
        var parsed;
        var opt_rules;

        check_command_exists(command);

        opt_rules = require( node_path.join( opt_root, command ) );

        return {
            command: command,
            options: commander.parse(argv, opt_rules)
        };
    }
};

