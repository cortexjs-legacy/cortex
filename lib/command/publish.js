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
var i18n        = require('../i18n');
var MESSAGE     = i18n.require('command-publish');

var REGEX_IS_SNAPSHOT = /\-SNAPSHOT$/;

module.exports = publish;

// have no fault tolerance, overload and clean your parameters ahead of time
// @param {Object} options
// - cwd: {node_path=} at least one of cwd and tar must not be undefined
// - force: {boolean=} force to publishing, default to false
// - tar: {node_path=} tar file, if not undefined, must exists
function publish(options, callback) {
    var registry = options.registry;
    var force = options.force;

    // prepare tgz file and package.json
    // @param {Object} opts
    // - pkg {Object} package json data
    // - tar {node_path} tar file
    // - snapshot {boolean}
    publish.prepare(options, function(err, data) {
        if(err){
            return callback(err);
        }

        if(data.is_snapshot && profile.option('enable_snapshot')){

            // force snapshot version
            options.force = true;
        }
            
        // @param {Object} options
        // - tar: {string} tar file path
        // - pkg: {Object} the object of package.json
        // - force: {boolean} force publishing
        // - registry: {string} absolute url
        neuropil.publish({
            tar: data.tar,
            pkg: data.pkg,
            force: options.force

        }, function(err, res, json) {

            // TODO
            // standardize callback parameters
            return callback(err);
        });
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
    var pkg;

    async.series([
        function(done) {
            // if tar file specified, extract it
            if(file){
                cwd = temp_package;

                logger.info( logger.template(MESSAGE.ANALYSIS_TARBALL, {
                    file: file
                }) );

                new targz().extract(file, temp_dir, function(err) {
                    if(err){
                        return done( logger.template(MESSAGE.ERR_EXTRACTION, {
                            file: file,
                            error: err
                        }) );

                    }

                    publish.check_package_file(cwd, function(err, data) {
                        if(err){
                            return done(err);
                        }

                        pkg = data;
                    });
                });
            
            // else compress files into an tar file
            }else{
                publish.check_package_file(cwd, function(err, data) {
                    if(err){
                        return done(err);
                    }

                    pkg = data;

                    file = node_path.join(temp_dir, 'package.tgz');
                    fs.copy(cwd, temp_package);

                    // TODO: fs.copy(filter)
                    fs.delete( node_path.resolve(temp_package, 'node_modules') );

                    logger.info( logger.template(MESSAGE.COMPRESS_TARBALL, {
                        dir: cwd
                    }) );

                    new targz().compress(temp_package, file, function(err) {
                        if(err){
                            return done( logger.template(MESSAGE.ERR_PACKAGING, {
                                dir: cwd,
                                file: file,
                                error: err
                            }) );
                        }
                        done();
                    });
                });
            }
        }

    ], function(err) {
        if(err){
            return callback(err);
        }

        callback(null, {
            tar: file,
            pkg: pkg,
            is_snapshot: REGEX_IS_SNAPSHOT.test(pkg.version)
        });
    });
};


publish.check_package_file = function(cwd, callback) {
    var package_json = node_path.join(cwd, 'package.json');
    var pkg;

    if(fs.exists(package_json)){
        try{
            pkg = fs.readJSON(package_json);
        }catch(e){
            return callback( logger.template(MESSAGE.FAIL_PARSE_PKG, {
                error: e
            }) );
        }

        return callback(null, pkg);

    }else{
        return callback( MESSAGE.NO_PACKAGE_JSON );
    }
}