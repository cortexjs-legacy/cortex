#!/usr/bin/env node

var node_path = require('path');
var runner = require('../lib/run-grunt.js');
var option = require('../lib/option.js');

var option_list = {
	cwd: {
		short: 'c',
		type: node_path,
		value: process.cwd()
	}
};

var parsed = option(option_list, process.argv, 2);

runner(['cortex.build'], parsed);
