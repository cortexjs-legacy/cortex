#!/usr/bin/env node

var nopt = require('nopt');
var node_path = require('path');
var runner = require('../lib/run-grunt.js');

var known_opts = {
	cwd: node_path
};

var short_hands = {
	c: ['--cwd']
};

var parsed = nopt(known_opts, short_hands, process.argv, 2);

// var argv = parsed.argv;
delete parsed.argv;

runner(['cortex.build'], parsed);
