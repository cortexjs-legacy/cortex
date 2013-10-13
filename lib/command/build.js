'use strict';

var build       = module.exports = {};
var fs          = require('fs-sync');
var node_path   = require('path');
var spawn       = require('child_process').spawn;

var pkg         = fs.readJSON(node_path.join(process.cwd(),'package.json'));
// with no fault tolerance with arguments
// no arguments overloading

// @param {Object} options
// - cwd: {node_path} absolute dir
// X - separator: {string}
// - define: {string}
// X - output: {node_path} the path of the ouput file, ending with '.js'
// - dist: {node_path} 
// - files: {Array.<string>} array of **absolute** file paths to be built all of which will be built into options.output
build.run = function (options, callback) {
    var build_script = pkg.cortex && pkg.cortex.build_script;

    build.MESSAGE = build.context.locale.require('command-build');

    if(!build_script){
        callback(build.MESSAGE.BUILD_SCRIPT_MUST_BE_DEFINED);
    }else{
        build_script = build_script.split(" ");
        spawn(build_script[0],build_script.splice(1),{
            stdio:"inherit"
        });
    }
};
