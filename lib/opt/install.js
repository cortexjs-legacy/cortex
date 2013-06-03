'use strict';

var node_path 	= require('path');
var node_url	= require('url');
var fs 			= require('fs-sync');

function is_empty_object(obj){
	for(var key in obj){
		return false;
	}

	return true;
};


function check_duplicate(modules){
	var map = {};

	modules.forEach(function(module) {
	    var name = module.split('@')[0];

	    if( !(name in map) ){
	    	map[name] = true;
	    
	    }else{
	    	process.stdout.write('With the "--save" option, installing more than one version of the module "' + name + '" is prohibited.\n');
	    	process.exit(1);
	    }
	});
};


exports.offset = 3;

exports.list = {
	cwd: {
		type: node_path,
		short: 'c',
		value: process.cwd()
	},

	registry: {
		type: node_url,
		value: 'http://registry.npmjs.org'
	},

	save: {
		type: Boolean,
		validate: function(save, parsed) {

			// if --save, package.json must exists
			if(save && !fs.exists(parsed.cwd, 'package.json')){
				process.stdout.write('package.json not found, could not save dependencies');
				process.exit(1);
			}

		    return true;
		},

		value: false
	},

	modules: {
		type: String,
		value: function(modules, parsed) {
			var remain = parsed.argv.remain;
			var parsed_modules;

			// > ctx install --modules ajax,lang
			if(modules){
			    parsed_modules = modules.split(/\s*,\s*/);
			
			// > ctx install ajax lang
		    // ['a@0.0.2'] -> {a: '0.0.2'}
			// ['a'] -> {a: 'latest'}
			}else if(remain.length){
				parsed_modules = remain; 

				// .map(function(module) {
				// 	module = module.split('@');

				// 	var name = module[0];
				// 	var version = module[1] || 'latest';

				// 	return name + '@' + version;
				// });
			
			}else{
				// > ctx install
				// Read from package.json
				parsed_modules = [];
				var module_map = {};
				var package_path = node_path.join( parsed.cwd, 'package.json' );

				if( fs.exists(package_path) ){

					// read modules from package.json
					var pkg = fs.readJSON(package_path);
					module_map = pkg.cortexDependencies || {};
				}

				if( !is_empty_object(module_map) ){
					process.stdout.write('Read cortexDependencies from package.json.\n');
				
				}else{
					process.stdout.write('Please specify the modules to be installed.\n');
					process.exit(1);
				}

				// -> ['a@0.0.2']
				Object.keys(module_map).forEach(function(name) {
				    parsed_modules.push( name + '@' + module_map[name] );
				});
			}

			// if --save, we should not install more than one version of a certain module
			parsed.save && check_duplicate(parsed_modules);

			return parsed_modules;
		}
	}
};

exports.info = 'Install specified modules or install modules from package.json';

exports.usage = 'ctx install <module>[,<modules>[,...]]\n'
	+ 'ctx install [options]';




