'use strict';

var connect 	= require('connect');
var node_path 	= require('path');

var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
var root = node_path.join(USER_HOME, '.cortex', 'built_modules');

module.exports = function(options, callback) {
    var app = connect();
	app.use(connect.static(root));
	app.use(connect.directory(root));
	app.listen(options.port, function() {
		var url = 'http://localhost:' + options.port;

	    process.stdout.write('Cortex server started at ' + url + '\n');
	    options.open && require('child_process').exec('open ' + url);
	    callback && callback()
	});
};