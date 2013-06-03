'use strict';

var node_path 	= require('path');
var fs 			= require('fs-sync');

var REGEX_ENDS_WITH_JS = '/\.js$/';

// start from process.argv[3]
exports.offset = 3;

exports.list = {
	cwd: {
		type: node_path,
		short: 'c',

		// `nopt` makes sure `cwd` is an absolute path
		value: process.cwd()
	},

	dist: {
		type: node_path,
		value: function(dist, parsed) {
			var cwd = parsed.cwd;

		    if(!dist){
		    	if( fs.isDir(cwd, 'dist') ){
		    		dist = node_path.join(cwd, 'dist');
		    	}
		    
		    }else if(!fs.doesPathContain(cwd, dist)){
		    	dist = undefined;
		    }
		    
		    return dist;
		}
	},

	seperator: {
		type: String,
		value: '@'
	},

	define: {
		type: String,
		value: 'define'
	},

	output: {
		type: node_path,
		short: 'o',
		value: function(output, parsed) {
			if(!output){
				output = 'build/index.js';
			}

			if( !fs.isPathAbsolute(output) ){
				output = node_path.join(parsed.cwd, output);
			}

			return output;
		}
	},

	files: {
		type: String,
		value: function(files, parsed) {
			var cwd = parsed.cwd;

			// if parsed.dist exists, skip parsing files
			if(parsed.dist){
				return [];
			}

			if ( !files ) {
				// build 'lib/' folder by default
			    files = fs.expand('lib/**/*.js', {
			    	cwd: cwd
			   	
			   	}).map(function(file) {
			   	    return node_path.join(cwd, file);
			   	});
			
			}else{
				files = files.split(',').map(function(file) {
					// absolutize
					var resolved_file = fs.isPathAbsolute(file) ? 
				    		// /path/to/search
				    		file : 

				    		// path/to/search -> {cwd}/path/to/search
				    		node_path.join(cwd, file);

				    if(fs.isFile(resolved_file)){
				    	// is javascript file and is under `cwd`
				    	if(REGEX_ENDS_WITH_JS.test(resolved_file) && fs.doesPathContain(cwd, resolved_file)){
				    		return resolved_file;
				    	}
				    	// ignore other files
				    
				    }else{
				    	// /path/to/search -> /path/to/search/**/*.js
				    	if(fs.isDir(resolved_file)){
				    		resolved_file = node_path.join(resolved_file, '**/*.js');
				    	}

				    	// /path/to/search/**/*.js
						// /path/to/search/**
						// /path/to/search/*.js
						// /path/to/search/*
				    	return fs.expand(resolved_file, {
				    		// make sure the result is inside `cwd`
				    		cwd: cwd

				    	// may contains directories
				    	// f -> absolute path
				    	}).filter(function(f) {
				    		return fs.isFile(f) && REGEX_ENDS_WITH_JS.test(f);
				    	});
				    }

				    return false;

				}).filter(function(file) {
					return !!file;
				
				// flatten
				}).reduce(function(a, b) {
				    return a.concat(b);

				}, []);
			}

			return files;
		}
	}
};


exports.info = 'Build module wrapper';

exports.usage = 'ctx build [options]';


