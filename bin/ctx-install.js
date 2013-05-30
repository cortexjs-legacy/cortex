#!/usr/bin/env node

'use strict';

var node_path = require('path');
var fs = require('fs-sync');
var option = require('../lib/option');
var install = require('../lib/command/install');

var option_list = {
	cwd: {
		type: node_path,
		short: 'c',
		value: process.cwd()
	},

	save: {
		type: Boolean,
		value: false
	}
};


var parsed = option(option_list, process.argv, 2);

////////////////////////////////////////////////////////////////////////////////
// santitize options

var package_path = node_path.join( parsed.cwd, 'package.json' );
var has_package = fs.exists(package_path);

if(parsed.save && !has_package){

	// TODO:
	// migrate to cortex.log.write
	process.stdout.write('package.json not found, could not save dependencies');
	process.exit(1);
}

var modules = {};

// ['a@0.0.2'] -> {a: '0.0.2'}
// ['a'] -> {a: 'latest'}
parsed.argv.remain.forEach(function(module) {
	module = module.split('@');

	var name = module[0];
	var version = module[1] || 'latest';

	modules[name] = version; 
});


function is_empty_object(obj){
	for(var key in obj){
		return false;
	}

	return true;
};


if( is_empty_object(modules) ){
	if(has_package){

		// read modules from package.json
		var pkg = fs.readJSON(package_path);
		modules = pkg.cortexDependencies || {};

		if( !is_empty_object(modules) ){
			process.stdout.write('Read cortexDependencies from package.json.\n');
		}
	}

	if( is_empty_object(modules) ){
		process.stdout.write('Please specify the modules to be installed.\n');
		process.exit(1);
	}
}

parsed.modules = modules;

// end santitize options
////////////////////////////////////////////////////////////////////////////////

// run command
install.run(parsed);

// (function() {
//     for(var option in parsed){
//     	process.stdout.write('option: ' + option + ' = ' + parsed[option] + '\n');
//     }
// })();






