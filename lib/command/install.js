#!/usr/bin/env node

var node_path = require('path');
var async = require('async');
var fs = require('fs-sync');
var Installer = require('cortex-install');
var grunt_runner = require('../util/grunt');


var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// TODO:
// migrate to cortex-profile
var CORTEX_ROOT = node_path.join(USER_HOME, '.cortex');
var module_root = node_path.join(USER_HOME, '.cortex', 'modules');


function log(msg){
	process.stdout.write(msg + '\n');
};


// Attension: there will no arguments checking
// @param {Object} options {
//		modules: {Object} modules to install, ['a@1.0.1', 'b@0.0.2'];
// 		save: {boolean} save cortexDependencies
//		cwd: {string} 
// }

// @param {function()} callback
module.exports = function(options, callback){
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

	async.waterfall([
		function(done) {
			log('Installing: ["' + modules.join('", "') + '"]');

		    installer.install(modules, function(error, data) {
		        if(error){
		        	throw error;
		        }

		        var installed_modules = [];
		        var name;

		        // {
		        //   'a': {
		        // 		'0.0.1': {}
		        // 		'0.0.2': {}
		        // 	 }
		        // }
		        for(name in data){

		        	// ['a@0.0.1', 'a@0.0.2']
		        	installed_modules = installed_modules.concat(
		        		Object.keys(data[name]).map(function(version) {
		        		    return name + '@' + version;
		        		})
		        	);
		        }
		    
		        done(null, installed_modules);
		    });
		},

		function(installed_modules, done) {
		    // build modules

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

			done(null, installed_modules);
		}

	], function(err, installed_modules) {

		// moving folder
		installed_modules.forEach(function(module_at_version) {
			var module_slash_version = module_at_version.replace('@', '/');

		    fs.copy(
		    	node_path.join(temp_dir, module_slash_version),
		    	node_path.join(module_root, module_slash_version), {
		    		force: true
		    	}
		    );
		});

		// save to package.json
		if(should_save){
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

		callback && callback();
	});
};







