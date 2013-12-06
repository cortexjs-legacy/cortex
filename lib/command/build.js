 'use strict';

var build       = module.exports = {};
var node_fs     = require('fs');
var fs          = require('fs-sync');
var node_path   = require('path');
var hum         = require('hum');
var semver      = require('semver');
var async       = require('async');
var putin       = require('put-in');
var pkg_helper  = require('../util/package');
var lang        = require('../util/lang');
var tmp         = require('../util/tmp');
var exec        = require('child_process').exec;

var USER_HOME   = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];


// publish modules to local server
// @param {Object} options
// - name: {string}
// - version: {string}
// - folder: {path}
build.publish = function(options, callback) {
    
};


// '1.2.3' -> '~1.2.0'
build.get_base_range = function (version) {
    var parsed_semver = semver.parse(version);

    return [parsed_semver.major, parsed_semver.minor, 0].join('.');
};


build.determine_tasks = function (name, version, options, callback) {
    var cache_root = this.context.profile.get('cache_root');
    var self = this;

    var tasks = {};

    if ( options.ranges ) {
        pkg_helper.get_module_document({
            name: name,
            cache_root: cache_root

        }, function (err, json) {
            if ( err ) {
                return callback(err);
            }

            var versions    = json && json.versions && Object.keys(json.versions) || [];
            versions.sort(semver.rcompare);

            // '1.2.3' -> '~1.2.0'
            var range       = self.get_base_range(version);
            var max_patch   = semver.maxSatisfying(versions, range);
            var max         = versions[0];
            
            if (
                // if the current minor(feature) doesn't exist
                !max_patch ||

                // greater or equal to
                semver.gte(version, max_patch)
            ) {
                tasks[version] = node_path.join(built_root, name, range);

                // if the package is not the latest patch,
                // it's impossible to be the latest of all versions
                if (
                    // if there's no versions on the regsitry
                    !max ||

                    // if current version is the greatest
                    semver.gte(version, max)
                ) {
                    tasks.latest = node_path.join(built_root, name, 'latest');
                }
            }

            // {
            //     '1.2.3': '/xxx/~1.2.0',
            //     'latest': '/xxx/latest'
            // }
            callback(null, tasks);
        });

    } else {
        tasks[version] = node_path.join(built_root, name, version);
        callback(null, tasks);
    }
};


// publish files from `from` to `to`
build.cp = function (from, to) {
    if ( from === to ) {
        return;
    }

    fs.exists(to) && fs.remove(to, {
        force: true
    });

    fs.copy(from, to, {
        force: true
    });
};


build._run = function (options, callback) {
    var pkg = options.pkg;

    var self = this;
    this.determine_tasks(pkg.name, pkg.version, options, function (err, tasks) {
        if ( err ) {
            return callback(err);
        }

        async.parallel(
            Object.keys(tasks).map(function (target_version) {
                var to = tasks[target_version];

                self.run_build_task(target_version, to, done);
            }), 

            callback
        );
    });
};


build.run_build_task = function (target_version, to, options, callback) {
    var task_name = options.builder_task;
    var pkg = 
    var init_config = {};
    var entries = {};

    options.entries.forEach(function (entry) {
        entries[ node_path.join(cwd, entry) ] = node_path.join(to, entry); 
    });

    init_config[task_name] = {
        'all': {
            entries: entries,
            targetVersion: target_version
        }
    };

    var self = this;

    async.parallel([

        // run commonjs builder
        function (done) {
            hum({
                cwd: options.cwd
            })
            .npmTasks(options.builder)
            .task(options.builder_task)
            .init(init_config)
            .options({
                force: true
            })
            .done(done);
        },

        // copy css
        function (done) {
            self.copy_css(to, options, done);
        }

    ], callback);
};


build.copy_css = function (to, options, callback) {
    var pkg = options.pkg;
    var css = lang.object_member_by_namespaces(pkg, 'directories.css');

    if ( css ) {
        css = node_path.join(options.cwd, css);

        try {
            this.cp(css, to);
        } catch(e) {
            return callback(e);
        }
        
        return callback(null);

    } else {
        callback(null);
    }
};


////////////////////////////////////////////////////////////////////////
// preparation
////////////////////////////////////////////////////////////////////////

// @param {Object} options
//      see ./lib/option/build.js for details
build.run = function(options, callback){
    // if the destination is not specified by user
    if ( !options.dest ) {
        options.dest = this.context.profile.get('built_root');
    }

    var self = this;

    var pkg = pkg_helper.get_package_json(options.cwd);

    if ( pkg.err ) {
        return callback(pkg.err);
    }

    options.pkg = pkg.cortex;

    this.MESSAGE = this.context.locale.require('command-build');
    this.run_build_script(options, function (err) {
        if ( err ) {
            return callback(err);
        }

        // distribution directory
        var dist = lang.object_member_by_namespaces(pkg, 'directories.dist');

        if ( dist ) {
            dist = node_path.join(options.cwd, dist);

            // if `dist` dir exists, skip building and just copy it
            if ( fs.exists(dist) ) {
                self.logger.info('{{cyan copy}} "directories.dist" to "' + options.dest + '"');

                self.cp(dist, options.dest);
                return callback(null);

            } else {
                // if `cortex.directories.dist` is declared, the dir must be existed.
                return callback({
                    code: 'EDISTNOTEXISTS',
                    message: 'dist dir "' + dist + '" does not exist.',
                    data: {
                        dist: dist
                    }
                });
            }

        } else {
            self.get_node_path(function (node_path) {
                options.node_path = node_path;

                // make sure the commonjs builder already installed
                self.check_builder(node_path, function (err) {
                    if ( err ) {
                        return callback(err);
                    }

                    self.get_entries(options.cwd, options.pkg, function (err, entries) {
                        if ( err ) {
                            return callback(err);
                        }

                        options.entries = entries;

                        self._run(options, callback);
                    });
                });
            });
        }
    });
};


build.get_node_path = function (callback) {
    require("nodepath").get(callback);
};


// Check if the builder exists.
build.check_builder = function (node_path, callback) {
    options.builder      = this.context.profile.get('builder');
    options.builder_task = this.context.profile.get('builder_task');

    if(!options.builder){
        return callback(this.MESSAGE.BUILDER_MUST_BE_DEFINED);
    }

    if(!fs.exists(node_path.join(node_path, 'node_modules', builder))){
        this.logger.info('\n{{cyan install}} commonjs builder...');

        // install tasks if not exists
        putin(node_path).install(builder, function(code){
            if(code === 0){
                callback(null);

            }else{
                callback(self.logger.template(self.MESSAGE.PACKAGE_NOT_FOUNT_ON_NPM,{
                    name: builder
                }));
            }
        });

    } else {
        callback(null);
    }
};


// Run custom build scripts, such as 'grunt'
build.run_build_script = function (options, callback) {
    var pkg = options.pkg;
    var build_script = lang.makeArray( pkg.scripts && pkg.scripts.build );

    if ( !build_script.length ) {
        return callback(null);
    }

    var self = this;

    this.logger.info('{{cyan run}} build script ...');

    exec( build_script.join(' && '), {
        cwd: options.cwd

    }, function(err, stdout, stderr){
        if ( err ) {
            return callback(err);
        }

        self.logger.info(stdout);
        stderr && self.logger.error(stderr);

        callback(null);
    });
};


build.get_entries = function (cwd, pkg, callback) {
    var main_entry = pkg.main || 'index.js';
    var entries = pkg.entries ? 
            fs.expand(pkg.entries, {
                cwd: cwd
            }) : 
            [];

    var fail = entries.some(function (entry) {
        // entries should not be located at the parent folder of the main entry.
        if ( node_path.relative(entry, main_entry).indexOf('..') === 0 ) {
            callback({
                code: 'EINVALIDENTRIES',
                message: 'entry "' + entry + '" should not be located at the parent folder of "' + main_entry + '"',
                data: {
                    main: main_entry,
                    entry: entry
                }
            });

            return true;
        }
    });
    
    if ( !fail ) {
        entries.push(main_entry);

        callback(null, entries);
    }
};

