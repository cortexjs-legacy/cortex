'use strict';

var watch = module.exports = {};

// var node_fs = require('fs');
var node_path       = require('path');
var stares          = require('stares');
var ignore          = require('ignore');
var pkg_helper      = require('../util/package');
var lang            = require('../util/lang');
var fs              = require('fs-sync');


// @param {Object} options
// - cwd: {Array.<path>}
watch.run = function(options, callback) {
    var self = this;

    self.watcher = stares({
        port: self.context.profile.get('watcher_rpc_port')
    
    }).on('all', function (event, filepath) {
        // cortex commander will santitize filepath to the right root directory of the repo
        self._rebuild(filepath);
    
    // for master watcher process
    }).on('message', function (msg) {
        if ( msg.task === 'watch' ) {

            if ( process.pid === msg.pid ) {
                
            }
        }
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
    pkg_helper.get_original_package(cwd, function (err, pkg) {
        if ( err ) {
            return callback(err);
        }

        var ignore_rules = lang.object_member_by_namespaces(pkg, 'cortex.ignore', []);

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
    });
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

                self.logger.info(cwd, '{{cyan unwatched}}');
                self.logger.debug('unwatched', arguments);
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


// use this trick to prevent endless rebuilding 
var locked = {};

watch._lock = function () {
    lang.makeArray(arguments).forEach(function (id) {
        locked[id] = true;
    });
};


watch._release = function () {
    lang.makeArray(arguments).forEach(function (id) {
        locked[id] = false;
    });
};


watch._is_locked = function (id) {
    return locked[id];
};


watch._rebuild = function (cwd) {
    var self = this;

    // If the current directory is already under building,
    // just ignore new tasks
    if ( self._is_locked(cwd) ) {
        return;
    }

    // lock it
    self._lock(cwd);

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

        var real_cwd = result.opt.cwd;

        // also lock the root directory of a repo
        self._lock(real_cwd);

        // exec cortex.commands.build method
        commander.run('build', result.opt, function(err) {
            self._release(cwd, real_cwd);

            if(err){
                self.logger.info('{{red|bold ERR!}}', err);
            }else{
                self.logger.info('{{bold OK!}} {{green|bold success.}}');
            }
        });
    });
};

