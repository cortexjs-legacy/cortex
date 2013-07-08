'use strict';

var node_path   = require('path');
var node_fs     = require('fs');
var node_url    = require('url');

var request     = require('request');
var async       = require('async');
var profile     = require('cortex-profile');
var fs          = require('fs-sync');
var targz       = require('tar.gz');

var logger      = require('../logger');
var neuropil    = require('../neuropil');

var REGEX_IS_SNAPSHOT = /\-SNAPSHOT$/;


// TODO:
// manage all errors, there must be at most one process.exit(1) whatever happens
function fail(msg){
    process.stdout.write(msg + '\n');
    process.exit(1);
}


module.exports = publish;

// have no fault tolerance, overload and clean your parameters ahead of time
// @param {Object} options
// - cwd: {node_path}
// - force: {boolean} force to publishing
// - tar: {node_path} tar file, if not undefined, must exists
function publish(options, callback) {
    var registry = options.registry;
    var force = options.force;

    // prepare tgz file and package.json
    // @param {Object} opts
    // - pkg {Object} package json data
    // - tar {node_path} tar file
    // - snapshot {boolean}
    publish.prepare(options, function(data) {
            
        // @param {Object} options
        // - tar: {string} tar file path
        // - pkg: {Object} the object of package.json
        // - force: {boolean} force publishing
        // - enable_snapshot: {boolean} whether to enable snapshot version
        // - registry: {string} absolute url
        neuropil.publish({
            tar: data.tar,
            pkg: data.pkg,
            force: options.force,

            // TODO:
            // collect all global configuration together with neuropil and remove out of cortex
            enable_snapshot: profile.option('enable_snapshot'),
            registry: options.registry

        }, callback);
    });
};


// santitize arguments
// prepare tar file and json data
publish.prepare = function(options, callback) {
    var file = options.tar;
    // file = '/Users/Kael/.npm/neuronjs/2.0.1/package.tgz';
    var temp_dir = node_path.join(profile.option('temp_root'), + new Date + '');
    var temp_package = node_path.join(temp_dir, 'package');
    var cwd = options.cwd;

    async.series([
        function(done) {
            // if tar file specified, extract it
            if(file){
                cwd = temp_package;
                process.stdout.write('Analysis tarball: "' + file + '".\n');
                new targz().extract(file, temp_dir, function(err) {
                    if(err){
                        fail('Error extracting "' + file + '", ' + err);

                        // TODO: temp_dir cleaner
                    }
                    done();
                });
            
            // else compress files into an tar file
            }else{
                file = node_path.join(temp_dir, 'package.tgz');
                fs.copy(cwd, temp_package);

                // TODO: fs.copy(filter)
                fs.delete( node_path.resolve(temp_package, 'node_modules') );

                process.stdout.write('Compressing tarball: "' + cwd + '".\n');
                new targz().compress(temp_dir, file, function(err) {
                    if(err){
                        fail('Error packaging "' + cwd + '" to "' + file + '", ' + err);
                    }
                    done();
                });
            }
        }

    ], function(err) {
        var package_json = node_path.join(cwd, 'package.json');
        var pkg;

        if(fs.exists(package_json)){
            try{
                pkg = fs.readJSON(package_json);
            }catch(e){
                fail('Fail to parsing package.json. ' + e);
            }

            callback({
                tar: file,
                pkg: pkg
            });

        }else{
            fail('No package.json file found.');
        }
    });
};
