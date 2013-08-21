'use strict';

var publish     = module.exports = {};

var node_path   = require('path');
var node_fs     = require('fs');
var node_url    = require('url');

var request     = require('request');
var async       = require('async');
var fs          = require('fs-sync');
var targz       = require('tar.gz');

var REGEX_IS_SNAPSHOT = /\-SNAPSHOT$/;

// have no fault tolerance, overload and clean your parameters ahead of time
// @param {Object} options
// - cwd: {node_path=} at least one of cwd and tar must not be undefined
// - force: {boolean=} force to publishing, default to false
// - tar: {node_path=} tar file, if not undefined, must exists
publish.run = function (options, callback) {
    var force = options.force;

    publish.MESSAGE = publish.context.locale.require('command-publish');

    // prepare tgz file and package.json
    // @param {Object} opts
    // - pkg {Object} package json data
    // - tar {node_path} tar file
    // - snapshot {boolean}
    publish.prepare(options, function(err, data) {
        if(err){
            return callback(err);
        }

        if(data.is_snapshot && publish.context.profile.option('enable_snapshot')){

            // force snapshot version
            options.force = true;
        }
            
        // @param {Object} options
        // - tar: {string} tar file path
        // - pkg: {Object} the object of package.json
        // - force: {boolean} force publishing
        publish.context.neuropil.publish({
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
    var temp_dir = node_path.join(publish.context.profile.option('temp_root'), + new Date + '');
    var temp_package = node_path.join(temp_dir, 'package');
    var cwd = options.cwd;
    var pkg;

    async.series([
        function(done) {
            // if tar file specified, extract it
            if(file){
                cwd = temp_package;

                publish.logger.info( publish.logger.template(publish.MESSAGE.ANALYSIS_TARBALL, {
                    file: file
                }) );

                new targz().extract(file, temp_dir, function(err) {
                    if(err){
                        return done( publish.logger.template(publish.MESSAGE.ERR_EXTRACTION, {
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
                    fs.remove( node_path.resolve(temp_package, 'node_modules') );

                    publish.logger.info( publish.logger.template(publish.MESSAGE.COMPRESS_TARBALL, {
                        dir: cwd
                    }) );

                    new targz().compress(temp_package, file, function(err) {
                        if(err){
                            return done( publish.logger.template(publish.MESSAGE.ERR_PACKAGING, {
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
            return callback( publish.logger.template(publish.MESSAGE.FAIL_PARSE_PKG, {
                error: e
            }) );
        }

        return callback(null, pkg);

    }else{
        return callback( publish.MESSAGE.NO_PACKAGE_JSON );
    }
}