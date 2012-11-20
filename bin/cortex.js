#! /usr/bin/env node
var tracer = require("tracer").colorConsole();
var ActionFactory = require("../lib/action-factory");

var ctx = {};
/**
 * cortex command line
 */

module.exports = ctx;

/**
 * run from command line
 */
if(require.main){
	var PROJECT_CONFIG = require("../package.json");

	var args = process.argv;
	var command = args[2];

	var version = PROJECT_CONFIG.version;

	if(command === "-v" || command === "--version"){
		console.info("v"+version);
		return;
	}


	var Action;

	if(!command){
		command = "help";
	}


	Action = require("../action/"+command);
	

	new Action(args.slice(3)).run();
}
