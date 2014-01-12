'use strict';

var init = module.exports = {};

var node_path       = require('path');
var fs              = require('fs-sync');
var spawn           = require('child_process').spawn;

var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

// @param {Object} options see 'lib/option/adduser.js' for details
init.run = function(options, callback) {
    process.argv.length = 0;

    var template = this.context.profile.get('init_template');

    // test if grunt-init exists
    var type = spawn('type', ['grunt-init']);

    type.on('error', function (e) {});

    type.on('close', function (code) {
        if ( !fs.exists(USER_HOME, '.grunt-init', template) ) {
            return callback('Grunt-init template for cortex is not found, run "git clone git@github.com:cortexjs/grunt-init-neuron.git ~/.grunt-init/' + template + '" first');
        }

        if ( code ) {
            return callback('"grunt-init" command not found, please install with "npm install grunt-init -g" first.');
        }

        var spawn_args = [template];

        if ( options.force ) {
            spawn_args.push('--force');
        }

        var grunt = spawn('grunt-init', spawn_args, {
            stdio: 'inherit'
        });

        grunt.on('error', function () {});

        grunt.on('close', function (e) {
            if ( e ) {
                return callback('Exit with errors, code: ' + e);
            }

            callback(null);
        });
    });

    
};