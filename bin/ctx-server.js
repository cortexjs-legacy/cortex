#!/usr/bin/env node

var connect = require('connect');
var nopt = require('nopt');
var node_path = require('path');
var runner = require('../lib/run-grunt.js');

var known_opts = {
	port: Number
};

var short_hands = {
	p: '--port'
};

var default_opts = {
	port: 8765
}

var parsed = nopt(known_opts, short_hands, process.argv, 2);

// var argv = parsed.argv;
delete parsed.argv;

Object.keys(default_opts).forEach(function(key) {
    if( !(key in parsed) ){
    	parsed[key] = default_opts[key];
    }
});


var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var root = node_path.join(USER_HOME, '.cortex', 'built_modules');

console.log(parsed.port, root);

var app = connect();
app.use(connect.static(root));
app.use(connect.directory(root));
app.listen(parsed.port, function() {
	var url = 'http://localhost:' + parsed.port;

    process.stdout.write('Cortex server started at ' + url + '\n');
    require('child_process').exec('open ' + url);
});