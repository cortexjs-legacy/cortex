'use strict';

var watch = module.exports = {};

// var node_fs = require('fs');
var node_path   = require('path');
var watcher     = require('multi-watcher');
var ignore      = require('ignore');
var pkg_helper  = require('../util/package');
var lang        = require('../util/lang');


// @param {Object} options
// - cwd: {Array.<path>}
watch.run = function(options, callback) {
    watch.watcher = watcher({
        data_file: watch.context.profile.option('')
    
    }).on('all', function (event, filepath) {
        // cortex commander will santitize filepath to the right root directory of the repo
        watch._rebuild(filepath);
    });

    options.stop ?
        watch.unwatch(options, callback) :
        watch.watch(options, callback);
};


watch.watch = function (options, callback) {
    var profile = watch.context.profile;
    var watched = profile.option('watched');

    var error;

    options.cwd.forEach(function (cwd) {
        if(error){
            return;
        }

        if( ~ watched.indexOf(cwd) ){
            watch.logger.warn('The current directory has already been watched.');
            return;
        }

        var pkg = pkg_helper.get_package_json(cwd);
        var ignore_rules = lang.object_member_by_namespaces(pkg, 'cortex.ignore', []);

        ignore({
            cwd: cwd
        }).addRuleFiles(
            ignore.select([
                '.cortexignore',
                // fallback
                '.npmignore',
                '.gitignore'
            ])

        ).addRules(ignore_rules).filtered(function (err, files) {
            if(err){
                error = err;
                return callback(err);
            }

            watch.watcher.watch(files, function (err) {
                if(err){
                    error = err;
                    return callback(err);
                }

                watch.logger.info('{{cyan watching}}', files);
            });
        });
    });

    // save `options.cwd` to the watched list
    profile.option('watched', options.cwd);

    if(!error){
        callback();
    }
};


watch.unwatch = function (options, callback) {
    
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

    var commander = watch.context.commander;
    var parsed = commander.parse(argv);

    // exec cortex.commands.build method
    commander.run('build', parsed.options.parsed, function(err) {
        if(err){
            watch.logger.info('{{red|bold ERR!}}', err);
        }else{
            watch.logger.info('{{bold OK!}} {{green|bold success.}}');
        }
    });  
};