
var grunt = require('grunt');
var node_path = require('path');

module.exports = function(options, done) {

    // There are often bugs about path calculating when working with third-party modules.
	// For better practice, always absolutize your path before passing your arguments
	var cwd = options.cwd ? node_path.resolve( options.cwd ) : process.cwd();

	grunt.cli.tasks = ['cortex.build'];

	grunt.cli({
		gruntfile: node_path.join(cwd, 'Gruntfile.js')

	}, done);
};