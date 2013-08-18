'use strict';

var watch = module.exports = {};

// var node_fs = require('fs');
var node_path = require('path');
var commander = require('../commander');
var gaze = require('gaze');

// @param {Object} options
// - cwd: {Array.<path>} 
watch.run = function(options, callback) {
    options.cwd.forEach(function (cwd) {
        var watcher = gaze( node_path.join(cwd, '**', '*'), function(err, watcher) {
            // Files have all started watching
            // watcher === this

            // Get all watched files
            watch.logger.info('{{cyan watching}}', cwd);

            // On changed/added/deleted
            this.on('all', function(event, filepath) {
                watch._rebuild(cwd);
            });

            // Get watched files with relative paths
            // console.log(this.relative());
        });
    });
};


watch._rebuild = function (cwd, callback) {
    watch.logger.info('{{cyan rebuild project...}}', cwd);

    // mock process.argv
    var argv = [
        '', '', 
        'build', 
        '--cwd',
        cwd
    ];

    var parsed = commander.parse(argv);

    // exec cortex.commands.build method
    commander.run('build', parsed.options.parsed, function(err) {
        if(err){
            watch.logger.error(err);
        }

        watch.logger.info('{{bold OK!}} {{green|bold success.}}');
    });  
};