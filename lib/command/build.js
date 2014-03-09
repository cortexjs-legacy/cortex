 'use strict';

var build       = module.exports = {};
var fs          = require('fs');
var fse         = require('fs-extra');
var expand      = require('fs-expand');
var node_path   = require('path');
var hum         = require('hum');
var semver      = require('semver');
var async       = require('async');
var putin       = require('put-in');
var pkg_helper  = require('../util/package');
var semver_helper = require('../util/semver');
var lang        = require('../util/lang');
var spawns      = require('spawns');
var npm_dir     = require('npm-dir');


// @param {Object} options
//      see ./lib/option/build.js for details
build.run = function(options, callback){
    // if the destination is not specified by user
    if ( !options.dest ) {
        options.dest = this.context.profile.get('built_root');
    }

    this.MESSAGE = this.context.locale.require('command-build');

    var self = this;
    async.series([
        function (done) {
            self.read_package_json(options, done);
        },

        function (done) {
            self.run_preinstall_script(options, done);
        },

        function (done) {
            // run custom build script
            self.run_prebuild_script(options, done);
        },

        function (done) {
            // determine build tasks
            self.determine_tasks(options, done);
        },

        function (done) {
            // real building
            self.build(options, done);
        }

    ], function (err) {
        callback(err);
    });
};


build.read_package_json = function (options, callback) {
    pkg_helper.get_original_package(options.cwd, function (err, pkg) {
        options.pkg = pkg;
        callback(err);
    });
};


// Run custom build scripts, such as 'grunt'
build.run_preinstall_script = function (options, callback) {
    if ( !options.preinstall ) {
        return callback(null);
    }

    this.run_script('preinstall', options, callback);
};


// Run custom build scripts, such as 'grunt'
build.run_prebuild_script = function (options, callback) {
    if ( !options.prebuild ) {
        return callback(null);
    }

    this.run_script('prebuild', options, callback);
};


build.run_script = function (script, options, callback) {
    var pkg = options.pkg;
    var scripts = lang.makeArray( pkg.scripts && pkg.scripts[script] )
        // skip empty scripts
        .filter(Boolean);

    if ( !scripts.length ) {
        return callback(null);
    }

    var self = this;

    this.logger.info('{{cyan run}} "scripts.' + script + '" ...');

    spawns( scripts, {
        cwd: options.cwd,
        stdio: 'inherit'

    }).on('spawn', function (command) {
        self.logger.info(' - {{cyan exec}} "' + command + '" ...');

    }).on('close', function (code, signal) {
        if ( code ) {
            callback({
                code: 'EBUILDSCRIPT',
                message: 'build step "scripts.' + script + '" executes as a failure. exit code: ' + code,
                data: {
                    code: code,
                    signal: signal,
                    script: script
                }
            });
        } else {
            callback(null);
        }

    }).on('error', function (err) {
        self.logger.warn('"scripts.' + script + '" let out an error: ' + err);
    });
};


build.determine_tasks = function (options, callback) {
    var cache_root  = this.context.profile.get('cache_root');
    var tasks       = options.tasks = {};
    var name        = options.pkg.name;
    var version     = options.pkg.version;
    var built_root  = options.dest;

    var parsed      = semver_helper.parse(version);

    if ( !parsed ) {
        return callback({
            code: 'EINVALIDVER',
            message: 'invalid semantic version "' + version + '" in package.json, see http://semver.org for details.',
            data: {
                version: version
            }
        });
    }

    // Cortex will no longer publish prerelease versions into the registry,
    // so use the original version directly.
    tasks[version] = node_path.join(built_root, name, version);

    var self = this;

    if ( options.ranges ) {
        pkg_helper.get_cached_document({
            name: name,
            cache_root: cache_root

        }, function (err, json) {
            if ( err ) {
                return callback(err);
            }

            var versions    = json && json.versions && Object.keys(json.versions) || [];
            versions.sort(semver.rcompare);

            // '1.2.3' -> '~1.2.0'
            var range       = semver_helper.get_base_range(parsed);
            var max_patch   = semver.maxSatisfying(versions, range);
            var max         = versions[0];

            if (
                // if the current minor(feature) doesn't exist
                !max_patch ||

                // greater or equal to
                semver.gte(version, max_patch)
            ) {
                // >>>> range
                tasks[range] = node_path.join(built_root, name, range);

                // if the package is not the latest patch,
                // it's impossible to be the latest of all versions
                if (
                    // if there's no versions on the regsitry
                    !max ||

                    // if current version is the greatest
                    semver.gte(version, max)
                ) {
                    // >>>> latest
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
        callback(null, tasks);
    }
};


build.build = function (options, callback) {
    var pkg = options.pkg;

    var self = this;

    // distribution directory
    var dist = lang.object_member_by_namespaces(options.pkg, 'directories.dist');

    if ( dist ) {
        dist = node_path.join(options.cwd, dist);

        // if `dist` dir exists, skip building and just copy it
        fs.exists(dist, function(exists){
            if ( exists ) {
                self.logger.info('dist dir "' + dist + '" found, {{cyan skip}} building ...');

                self.copy_dist(dist, options, callback);

            } else {
                // if `cortex.directories.dist` is declared, the dir must be existed.
                callback({
                    code: 'EDISTNOTEXISTS',
                    message: 'dist dir "' + dist + '" does not exist.',
                    data: {
                        dist: dist
                    }
                });
            }
        });

    } else {
        self.get_node_path(function (search_path) {
            options.search_path = search_path;

            // make sure the commonjs builder already installed
            self.check_builder(search_path, options, function (err) {
                if ( err ) {
                    return callback(err);
                }

                self.get_entries(options, function (err) {
                    if ( err ) {
                        return callback(err);
                    }

                    var tasks = options.tasks;

                    async.series(
                        Object.keys(tasks).map(function (target_version) {
                            return function (done) {
                                var to = tasks[target_version];
                                self.run_build_task(target_version, to, options, done);
                            }
                        }),

                        callback
                    );
                });
            });
        });
    }
};


// copy dist dir to the destination dirs
build.copy_dist = function (dist, options, callback) {
    var self = this;
    var tasks = [];
    lang.each(options.tasks, function (to) {
        self.logger.info('{{cyan copy}} "' + dist + '" to "' + to + '".');
        tasks.push(function(done){
            self.cp(dist, to, done);
        });
    });

    async.parallel(tasks,callback);
};


build.get_node_path = function (callback) {
    callback(npm_dir.dir);
};


// Check if the builder exists.
build.check_builder = function (search_path, options, callback) {
    var builder = options.builder = this.context.profile.get('builder');
    options.builder_task = this.context.profile.get('builder_task');

    if(!builder){
        return callback(this.MESSAGE.BUILDER_MUST_BE_DEFINED);
    }

    fs.exists(node_path.join(search_path, builder), function(exists){
        if(!exists){
            this.logger.info('\n{{cyan install}} commonjs builder...');

            // install tasks if not exists
            putin( node_path.dirname(search_path) ).install(builder, function(code){
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
    });
};


build.get_entries = function (options, callback) {
    var cwd = options.cwd;
    var pkg = options.pkg;

    var main_entry = options.main_entry = pkg.main || 'index.js';
    main_entry = this.ensure_ext(main_entry, 'js');

    // the module '<name>.js'
    var main_by_name = node_path.join(cwd, pkg.name) + '.js';
    var main_path = node_path.join(cwd, main_entry);

    fs.exists(main_by_name, function (exists){
        if ( exists && main_by_name !== main_path ) {
            return callback({
                code: 'EMAINCONFLICT',
                message: 'if "<package.name>.js" exists, it must be `package.main`, or you should rename it.',
                data: {
                    name: pkg.name
                    main: pkg.main
                }
            });
        }

        var entries = options.entries = pkg.entries ?
                expand.sync(pkg.entries, {
                    cwd: cwd
                }) :
                [];

        var fail = entries.some(function (entry) {
            // entries should not be located at the parent folder of the main entry.
            if ( node_path.relative( node_path.dirname(main_entry), entry).indexOf('..') === 0 ) {
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
            // prevent duplication
            if ( ! ~ entries.indexOf(main_entry) ) {
                entries.push(main_entry);
            }
            
            callback(null);
        }
    });
};


build.ensure_ext = function (path, ext) {
    var regex = new RegExp( '\\.' + ext + '$', 'i');

    if ( !regex.test(path) ) {
        path += '.' + ext;
    }

    return path;
};


build.run_build_task = function (target_version, to, options, callback) {
    var task_name = options.builder_task;
    var init_config = {};
    var entries = {};
    options.entries.forEach(function (entry) {
        var path_from = node_path.join(options.cwd, entry);
        var path_to

        entries[path_from] = node_path.join(
            to,
            entry === options.main_entry ?
                // main entry will 
                options.pkg.name + '.js' :
                entry
        );
    });

    init_config[task_name] = {
        'all': {
            options: {
                entries         : entries,
                mainEntry       : options.main_entry,
                pkg             : options.pkg,
                targetVersion   : target_version,
                cwd             : options.cwd
            }
        }
    };

    var self = this;

    async.series([
        // run commonjs builder
        function (done) {
            hum({
                cwd: options.cwd,
                path: options.search_path
            })
            .npmTasks(options.builder)
            .task(options.builder_task)
            .init(init_config)
            .options({
                force: options.force,
                stack: options.stack
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
        var source = node_path.join(options.cwd, css);
        var dest = node_path.join(to, css);
        this.cp(source, dest, callback);
    } else {
        callback(null);
    }
};


// publish files from `from` to `to`
build.cp = function (from, to, callback) {
    var self = this;
    if ( from === to ) {
        callback(null);
        return;
    }

    fs.exists(to, function(exists){
        var tasks = [];

        if(exists){
            tasks.push(function(done){
                fse.remove(to,done);
            });
        }

        tasks.push(function(done){
            self.logger.info('{{cyan copy}} ' + from + ' -> ' + to);
            fse.copy(from, to, done);
        });

        async.series(tasks,callback);
    });
};

