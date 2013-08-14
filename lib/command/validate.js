'use strict';

var validator   = module.exports = {};

var async       = require('async');
var semver      = require('semver');
var lang        = require('../util/lang');
var fs          = require('fs-sync');
var node_path   = require('path');

var i18n        = require('../i18n');
var neuropil    = require('../neuropil');
var MESSAGE     = i18n.require('command-validate');

var REGEX_IS_SNAPSHOT = /\-SNAPSHOT$/;


// @param {Object} options {
// - cwd        : {string}
// - export     : {string} absolute url

validator.run = function(options, callback) {
    var cwd = options.cwd;
    var package_file = node_path.join(cwd, 'package.json');
    var export_file = options['export'];

    if(!fs.exists(package_file)){
        return callback( MESSAGE.PACKAGE_NOT_SPECIFIED );
    }

    var pkg = fs.readJSON(package_file);

    var name = pkg.name;
    var version = pkg.version;

    if(!semver.valid(version)){
        return callback(
            validator.logger.template(MESSAGE.INVALID_VERSION, {
                version: version
            })
        );
    }

    var series = [];

    series.push(function(done) {

        // check if the current module version is available
        neuropil.exists({
            name: name, 
            version: version

        }, function(err, data) {
            if(err){
                validator.logger.warn('NPM server error, skip checking name and version: ' + err);

            }else{
                if(data.exists && !REGEX_IS_SNAPSHOT.test(version)){
                    return done(
                        validator.logger.template(MESSAGE.MODULE_VERSION_EXISTS, {
                            name: name,
                            version: version
                        })
                    );
                }
            }

            done();
        });
    });


    // check if each of the dependencies exists
    var cortex_dependencies = pkg.cortexDependencies || {};
    var exact_dependencies = {};

    Object.keys(cortex_dependencies).forEach(function(dep) {
        var dep_version = cortex_dependencies[dep];

        series.push(function(done) {
            npm.exists(dep, cortex_dependencies[dep], function(error, data) {
                done();

                if(error){
                    return validator.logger.warn( validator.logger.template('NPM server error, skip checking dependency "{{name}@{{version}}"', {
                        name: dep,
                        version: dep_version
                    }) );

                }

                if(data.exists){
                    exact_dependencies[dep] = data.latest;
                
                }else{
                    return done(
                        validator.logger.template(MESSAGE.MODULE_DEPS_UNEXISTED, {
                            name: dep,
                            version: dep_version 
                        })     
                    );
                }
            });
        });
    });

    async.series(series, function(err) {
        if(err){
            return callback(err);
        }

        var pkg = {};

        if(export_file){

            // not override existed data of "package.json"
            if(fs.exists()){
                pkg = fs.readJSON(export_file);
            }

            if(!pkg.cortex){
                pkg.cortex = {};
            }

            pkg.cortex.exactDependencies = lang.mix(pkg.cortex.exactDependencies || {}, exact_dependencies);

            fs.write(export_file, JSON.stringify(pkg, null, 4));
        }

        validator.logger.info('Validation {{green succeeded}}.');

        callback();
    });

};
