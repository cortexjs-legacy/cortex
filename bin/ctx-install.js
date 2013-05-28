#!/usr/bin/env node

var node_path = require('path');
var option = require('../lib/option.js');
var fs = require('fs-more').sync;
var install = require('cortex-install');

var option_list = {
	cwd: {
		type: node_path,
		short: 'c',
		value: process.cwd()
	},

	save: {
		type: Boolean
	}
};


var parsed = option(option_list, process.argv, 2);

var modules = parsed.argv.remain;
var has_package = fs.exists('package.json');

if(modules.length === 0){

	if(has_package){
		var pkg = fs.readJSON('package.json');
		var deps = modules = (pkg.cortexDependencies || {});

		Object.keys(deps).forEach(function(key) {
		    modules.push(key + '@' + deps[key]);
		});
	}

	if(modules.length === 0){
		process.stdout.write('No dependencies found in package.json, please specify the modules to be installed.\n');
		process.exit(1);
	}
}








