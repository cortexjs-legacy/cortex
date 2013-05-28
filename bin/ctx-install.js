#!/usr/bin/env node

var node_path = require('path');
var async = require('async');
var fs = require('fs-sync');
var install = require('cortex-install').install;

var grunt_runner = require('../lib/run-grunt');
var option = require('../lib/option');

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


var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var CORTEX_ROOT = node_path.join(USER_HOME, '.cortex');

var temp_dir = node_path.join(CORTEX_ROOT, 'tmp', + new Date);
var module_root = node_path.join(USER_HOME, '.cortex', 'modules');

var series = [];

// {
//		a: ['1.2.3', '1.3.3'],
// 		b: ['0.0.1']
// }
var installed_module_map = {};


function log(msg){
	process.stdout.write(msg + '\n');
};


modules.forEach(function(module){
	series.push(function(done) {

		log();

	    install(temp_dir, module, function(error, data) {
	        if(error){
	        	throw error;
	        }

	        var dependencies = data.dependencies;
	        var key;

	        for(module_name in dependencies){
	        	if( !(module_name in installed_module_map) ){

	        		// there might be more than one version for a certain module
	        		installed_module_map[module_name] = [];
	        	}


	        	installed_module_map[module_name].push(dependencies[dependencies]);
	        }

	        done();
	    });
	});
});


async.parallel(series, function() {
	var installed_modules = [];
	var series = [];

	Object.keys(installed_module_map).forEach(function(module) {
		var versions = installed_module_map[module];

		installed_modules = installed_modules.concat( versions.map(function(version) {
		    return node_path.join(module, version);
		}) );
	});

	installed_modules.forEach(function(module_slash_version) {
	    series.push(function(done) {

	    	log('run grunt-task: cortex.build on ', node_path.join(temp_dir, module_slash_version));
	        grunt_runner('cortex.build', {
	        	cwd: node_path.join(temp_dir, module_slash_version)

	        }, done);
	    })
	});

	async.parallel(series, function() {

		installed_modules.forEach(function(module_slash_version) {
		    fs.copy(
		    	node_path.join(temp_dir, module_slash_version),
		    	node_path.join(module_root, module_slash_version), {
		    		force: true
		    	}
		    );
		});
	    
	});
});







