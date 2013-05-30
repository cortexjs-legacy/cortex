#!/usr/bin/env node

var node_path = require('path');
var async = require('async');
var fs = require('fs-sync');
var Installer = require('cortex-install');
var grunt_runner = require('../run-grunt');


var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// TODO:
// migrate to cortex-profile
var CORTEX_ROOT = node_path.join(USER_HOME, '.cortex');
var module_root = node_path.join(USER_HOME, '.cortex', 'modules');


function log(msg){
	process.stdout.write(msg + '\n');
};


function push_uniq(array, item){
	if(item instanceof Array){
		item.forEach(function(i) {
		    push_uniq(array, i);
		});

	}else if(array.indexOf(item) === -1){
		array.push(item);
	}
};


function clean(){

};


exports.tearDown = function() {
	  
};


// Attension: there will no arguments checking
// @param {Object} options {
//		modules: {Array.<string>} modules to install, 'async@0.0.2'; 
//			you should not install more than one 
// 		save: {boolean} save cortexDependencies
// }

// @param {function()} callback
exports.run = function(options, callback){
	var modules = options.modules;
	var should_save = options.save;
	var cwd = options.cwd;

	// 
	var temp_dir = node_path.join(CORTEX_ROOT, 'tmp', + new Date + '');

	var installer = new Installer({

		// install modules into a temporary directory
	    dir : temp_dir,
	    key : "cortexDependencies",
	    registry : "registry.npm.dp"
	});

	var series = [];

	// {
	//		a: ['1.2.3', '1.3.3'],
	// 		b: ['0.0.1']
	// }
	var installed_module_map = {};

	Object.keys(modules).forEach(function(name){
		var version = modules[name];

		series.push(function(done) {
			log('Installing ' + name + '@' + version + '...');

		    installer.installModule(name, version, function(error, data) {
		        if(error){
		        	throw error;
		        }

		        // a: '1.2.3'
		        // b: ['0.0.1', '0.0.2']
		        var dependencies = data.dependencies;
		        var key;

		        for(module_name in dependencies){
		        	if( !(module_name in installed_module_map) ){

		        		// there might be more than one version for a certain module
		        		installed_module_map[module_name] = [];
		        	}

		        	// there might be more than one version
		        	push_uniq( installed_module_map[module_name], dependencies[module_name]) );
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

				// '1.2.3' -> 'a/1.2.3'
			    return node_path.join(module, version);
			}) );
		});


		// TODO:
		// scheme 1: npm installer
		// scheme 2: override `grunt.loadNpmTasks` method
		// installed_modules.forEach(function(module_slash_version) {
		//     series.push(function(done) {

		//     	log('run grunt-task: cortex.build on ', node_path.join(temp_dir, module_slash_version));
		//         grunt_runner('cortex.build', {
		//         	cwd: node_path.join(temp_dir, module_slash_version)

		//         }, done);
		//     })
		// });

		async.parallel(series, function() {
			installed_modules.forEach(function(module_slash_version) {
			    fs.copy(
			    	node_path.join(temp_dir, module_slash_version),
			    	node_path.join(module_root, module_slash_version), {
			    		force: true
			    	}
			    );
			});

			if(save){
				var package_file = node_path.join(cwd, 'package.json');
				var pkg = fs.readJSON(package_file);

				var deps = pkg.cortexDependencies || (pkg.cortexDependencies = {});
				var exact_deps = pkg.cortexExactDependencies || (pkg.cortexExactDependencies = {});

				Object.keys(modules).forEach(function(name) {

				    var exact_version = installed_module_map[name][0];

				    deps[name] = '~' + exact_version;
				    exact_deps[name] = exact_version;
				});

				fs.write( package_file, JSON.stringify(pkg, null, 4) );
			}	

			callback();
		});
	});
};







