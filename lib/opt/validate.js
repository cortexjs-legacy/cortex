#!/usr/bin/env node

'use strict';

var node_path 	= require('path');
var node_url	= require('url');
var fs			= require('fs-sync');

exports.offset = 3;

exports.list = {
	cwd: {
		type: node_path,
		short: 'c',
		value: process.cwd()
	},

	'export': {
		type: node_path,
		short: 'e',
		value: function(path, parsed) {
			if(!path){
				path = 'package.json';
			}

		    return fs.isPathAbsolute(path) ? path : node_path.join(parsed.cwd, path);
		}
	},

	registry: {
		type: node_url
	}
};