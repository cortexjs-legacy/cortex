 'use strict';

var build       = module.exports = {};
var node_fs     = require('fs');
var fs          = require('fs-sync');
var node_path   = require('path');
var hum         = require('hum');
var semver      = require('semver');
var putin       = require('put-in');
var pkg_helper  = require('../util/package');
var lang        = require('../util/lang');
var tmp         = require('../util/tmp');

var USER_HOME   = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var build_attempt_count = 0;


// publish modules to local server
// @param {Object} options
// - name: {string}
// - version: {string}
// - folder: {path}
build.publish = function(options, callback) {
    this.logger.info('{{cyan publishing...}}');

    var built_root = this.context.profile.get('built_root');
    var cache_root = this.context.profile.get('cache_root');

    var self = this;

    pkg_helper.get_module_document({
        name: options.name,
        cache_root: cache_root

    }, function (err, json) {
        if ( err ) {
            return callback(err);
        }

        var range;
        var range_root;
        var parsed_semver = lang.parseSemver(options.version);
        var versions = json && json.versions && Object.keys(json.versions) || [];

        if ( parsed_semver ) {
            range = parsed_semver.range;
            range_root = node_path.join(built_root, options.name, range);
        }
        

        try{
            var to = node_path.join(built_root, options.name, options.version);
            self.publish_to(options.folder, to);

            if (
                // if there's no versions on the regsitry
                versions.length === 0 ||

                // if the current module is not the newest version of the range
                semver.maxSatisfying(versions, range) === options.version ||

                // if has not been built before 
                !fs.exists(range_root)
            ) {
                self.publish_to(options.folder, range_root);
            }

            callback(null);

        }catch(e){
            callback(e);
        }
    });
};


build.publish_to = function (from, to) {
    fs.exists(to) && fs.remove(to, {
        force: true
    });

    fs.copy(from, to, {
        force: true
    });
};


// @param {Object} options
// - cwd: {node_path} absolute dir
// X - separator: {string}
// - define: {string}
// X - output: {node_path} the path of the ouput file, ending with '.js'
// - dist: {node_path}
build._run = function (options, callback) {
    var pkg = fs.readJSON(node_path.join(options.cwd,'package.json'));
    var CORTEX_BUILT_TEMP = node_path.join(options.cwd, this.context.profile.get('built_temp'));

    if ( options.clean ) {
        tmp.mark(CORTEX_BUILT_TEMP);
    }

    var builder = this.context.profile.get('builder'); // neuron
    var builder_name = builder + "-build";
    var build_task_config;
    var pkg_name = "grunt-cortex-" + builder + "-build";
    var task_root = options.node_lib_path;

    var init_opt = {
        "all":{
            // direct pass all options of cortex build to builder tasks
            options: options
        }
    };
 
    var init = {};
    init[builder_name] = init_opt;

    this.MESSAGE = this.context.locale.require('command-build');

    if(!builder){
        return callback(this.MESSAGE.BUILDER_MUST_BE_DEFINED);
    }

    var self = this;

    if(!fs.exists(node_path.join(task_root,"node_modules",pkg_name))){
        this.logger.info('\n{{cyan install}} commonjs builder...');

        putin(task_root).install(pkg_name, function(code){
            if(code === 0){
                self.run(options,callback);
            }else{
                callback(self.logger.template(self.MESSAGE.PACKAGE_NOT_FOUNT_ON_NPM,{
                    name:pkg_name
                }));
            }
        });

    }else{
        hum({
            path: node_path.join(task_root,"node_modules"),
            cwd: options.cwd
        })
        .npmTasks(pkg_name)
        .task(builder_name)
        .init(init)
        .options({
            force: true
        })
        .done(function(err){
            if(err){return callback(err);}
            if(options.publish){
                var data = {
                    name: pkg.name,
                    version: pkg.version,
                    folder: node_path.join(CORTEX_BUILT_TEMP, pkg.name, pkg.version)
                }
                self.publish(data,callback);
            }else{
                callback(null);
            }
        });
    }
};

build.run = function(options, callback){
    var self = this;

    require("nodepath").get(function(node_lib_path){
        options.node_lib_path = node_path.join(node_lib_path,"lib");
        self._run(options, callback);
    });
}
