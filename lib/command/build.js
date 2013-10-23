'use strict';

var build       = module.exports = {};
var node_fs     = require('fs');
var fs_sync     = require('fs-sync');
var node_path   = require('path');
var spawn       = require('child_process').spawn;
var hum         = require('hum');
var putin       = require('put-in');

var USER_HOME   = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];

var build_attempt_count = 0;


// publish modules to local server
// @param {Object} options
// - name: {string}
// - version: {string}
// - folder: {path}
build.publish = function(options, callback) {
    build.logger.info('{{cyan publishing...}}');

    var CORTEX_BUILT_ROOT = build.context.profile.option('built_root');

    var to = node_path.join( CORTEX_BUILT_ROOT, options.name, options.version );

    try{
        fs_sync.remove(to) && fs_sync.remove(to, {
            force: true
        });

        fs_sync.copy(options.folder, to, {
            force: true
        });

        callback(null);

    }catch(e){
        callback(e);
    }
}

// @param {Object} options
// - cwd: {node_path} absolute dir
// X - separator: {string}
// - define: {string}
// X - output: {node_path} the path of the ouput file, ending with '.js'
// - dist: {node_path} 
// - files: {Array.<string>} array of **absolute** file paths to be built all of which will be built into options.output
build.run = function (options, callback) {
    var pkg = fs_sync.readJSON(node_path.join(options.cwd,'package.json'));
    var CORTEX_BUILT_TEMP = build.context.profile.option('built_temp');
    var builder = build.context.profile.option('builder'); // neuron
    var builder_name = builder + "-build";
    var build_task_config;
    var pkg_name = "grunt-cortex-" + builder + "-build";
    var task_root = node_path.join(USER_HOME,".cortex","_global_tasks");
    var dest_root = node_path.join(CORTEX_BUILT_TEMP);
    var init_opt = {
        "all":{
            options:{
                dest_root:dest_root
            }
        }
    };
 
    var init = {};
    init[builder_name] = init_opt;


    build.MESSAGE = build.context.locale.require('command-build');

    if(!builder){
        return callback(build.MESSAGE.BUILDER_MUST_BE_DEFINED);
    }



    if(!fs_sync.exists(node_path.join(task_root,"node_modules",pkg_name))){

        putin(task_root).install(pkg_name,function(code){
            if(code == 0){
                build.run(options,callback);
            }else{
                callback(build.logger.template(build.MESSAGE.PACKAGE_NOT_FOUNT_ON_NPM,{
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
    .done(function(err){
        if(err){return callback(err);}
        if(options.publish){
            var data = {
                name: pkg.name,
                version: pkg.version,
                folder: node_path.join(options.cwd, dest_root, pkg.name, pkg.version)
            }
            build.publish(data,callback);
        }else{
            callback(null);
        }
    });

    }
};
