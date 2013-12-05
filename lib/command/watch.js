'use strict';

var watch = module.exports = {};

// var node_fs = require('fs');
var node_path       = require('path');
var multi_watcher   = require('multi-watcher');
var ignore          = require('ignore');
var pkg_helper      = require('../util/package');
var lang            = require('../util/lang');
var fs              = require('fs-sync');


// @param {Object} options
// - cwd: {Array.<path>}
watch.run = function(options, callback) {
    var self = this;

    self.watcher = multi_watcher({
        data_file: node_path.join( self.context.profile.get('profile_root'), 'watcher_handle.js' )
    
    }).on('all', function (event, filepath) {
        // cortex commander will santitize filepath to the right root directory of the repo
        self._rebuild(filepath);
    });

    options.stop ?
        self.unwatch(options, callback) :
        self.watch(options, callback);
};


watch.watch = function (options, callback) {
    var self = this;

    var profile = self.context.profile;
    var watched = profile.get('watched');
    var error;

    options.cwd.forEach(function (cwd) {
        if(error){
            return;
        }

        if( ~ watched.indexOf(cwd) ){
            self.logger.warn('The current directory has already been watched.');
            return;
        }

        self._get_files(cwd, function (err, files) {
            if(err){
                error = err;
                return callback(err);
            }

            self.watcher.watch(files, function (err) {
                if(err){
                    error = err;
                    return callback(err);
                }

                self.logger.info('{{cyan watching}}', cwd, '...');
            });
        });
    });

    // save `options.cwd` to the watched list
    // profile.set('watched', options.cwd);

    if(!error){
        callback(null);
    }
};


watch._get_files = function (cwd, callback) {
    var pkg = pkg_helper.get_package_json(cwd);

    if ( pkg.err ) {
        return callback(pkg.err);
    }

    var ignore_rules = lang.object_member_by_namespaces(pkg.pkg, 'cortex.ignore', []);

    var files = fs.expand('**', {
        cwd: cwd,
        dot: true

    }).filter(
        ignore().addIgnoreFile(
            ignore.select([
                '.cortexignore',
                '.npmignore',
                '.gitignore'
            ])
        ).addPattern(ignore_rules).createFilter()
    );

    callback(null, files);
};


watch.unwatch = function (options, callback) {
    var self = this;
    var profile = self.context.profile;
    // var watched = profile.get('watched');

    var error;

    options.cwd.forEach(function (cwd) {
        if(error){
            return;
        }

        self._get_files(cwd, function (err, files) {
            if(err){
                error = err;
                return callback(err);
            }

            self.watcher.unwatch(files, function () {
                // Actually, multi-watcher will pass no `err` param in callback of method 'unwatch'
                // if(err){
                //     error = err;
                //     return callback(err);
                // }

                self.logger.info(cwd, '{{cyan watched}}');
                callback(null);
            });
        });
    });

    // save `options.cwd` to the watched list
    // profile.set('watched', options.cwd);

    if(!error){
        callback(null);
    }
};


watch._rebuild = function (cwd, callback) {
    var self = this;

    self.logger.info('file "' + cwd + '" changed,', '{{cyan rebuild project...}}');

    // mock process.argv
    var argv = [
        '', '', 
        'build', 
        '--cwd',
        cwd
    ];

    var commander = self.context.commander;
    var parsed = commander.parse(argv, function(err, result, details){
        if ( err ) {
            return self.logger.info('{{red|bold ERR!}}', err);
        }

        // exec cortex.commands.build method
        commander.run('build', result.opt, function(err) {
            if(err){
                self.logger.info('{{red|bold ERR!}}', err);
            }else{
                self.logger.info('{{bold OK!}} {{green|bold success.}}');
            }
        });
    });
};


