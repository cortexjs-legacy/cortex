#! /usr/bin/env node
var tracer = require("tracer").colorConsole();
var ActionFactory = require("../actions/action_factory");

var ctx = {};
/**
 * cortex command line
 */

var AVAILIABLE_ACTIONS = require("../actions.json");

process.on('uncaughtException', function (err) {
	tracer.error('Caught exception: ' + err);
	process.exit(1);
});

/**
 * prepare actions
 */
AVAILIABLE_ACTIONS.forEach(function(actionName){
	ctx[actionName] = require("../actions/"+actionName);
});


var PROJECT_CONFIG = require("../package.json");

var args = process.argv;
var command = args[2];

var version = PROJECT_CONFIG.version;

if(command === "-v" || command === "--version"){
	console.info("v"+version);
}


var Action = ctx["help"];
if(ctx[command]){
	Action = ctx[command];
}


new Action(args.slice(3)).run();
