#!/usr/bin/env node

var nopt = require('nopt');
var node_path = require('path');

var build = require('../lib/build.js');


var option_list = {
	cwd: {
		short: 'c',
		info: 'specify folder to build',
		type: node_path
	}
};

var known_opts = {};
var short_hands = {};

var parsed = nopt(known_opts, short_hands, process.argv, 2);
var argv = parsed.argv;
delete parsed.argv;

build(parsed);







