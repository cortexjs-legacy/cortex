'use strict';

var node_path 	= require('path');
var fs 			= require('fs-sync');

function is_empty_object(obj){
	for(var key in obj){
		return false;
	}

	return true;
};


exports.offset = 3;

exports.list = {
	cwd: {
		type: node_path,
		short: 'c',
		value: process.cwd()
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

			// > ctx install --modules ajax,lang
			if(modules){
			    return modules.split(/\s*,\s*/);
			}

			// > ctx install ajax lang
		    // ['a@0.0.2'] -> {a: '0.0.2'}
			// ['a'] -> {a: 'latest'}
			var remain = parsed.argv.remain;

			if(remain.length){
				return remain.map(function(module) {
					module = module.split('@');

					var name = module[0];
					var version = module[1] || 'latest';

					return name + '@' + version;
				});
			}
			
			// > ctx install
			// Read from package.json
			module = [];
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
			    modules.push( name + '@' + module_map[name] );
			});

			return modules;
		}
	}
};


