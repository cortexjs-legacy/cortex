#!/usr/bin/env node

var connect = require('connect');
var node_path = require('path');
var runner = require('../lib/run-grunt.js');
var option = require('../lib/option.js');

var option_list = {
	port: {
		short: 'p',
		type: Number,
		value: 8765
	},

	open: {
		type: Boolean,
		value: true
	}
}

var parsed = option(option_list, process.argv, 2);

var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var root = node_path.join(USER_HOME, '.cortex', 'built_modules');

var app = connect();
app.use(connect.static(root));
app.use(connect.directory(root));
app.listen(parsed.port, function() {
	var url = 'http://localhost:' + parsed.port;

    process.stdout.write('Cortex server started at ' + url + '\n');
    parsed.open && require('child_process').exec('open ' + url);
});