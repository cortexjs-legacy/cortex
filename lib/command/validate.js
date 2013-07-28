'use strict';

var async       = require('async');
var semver      = require('semver');
var lang        = require('../util/lang');
var fs          = require('fs-sync');
var node_path   = require('path');

var logger      = require('../logger');
var i18n        = require('../i18n');
var MESSAGE     = i18n.require('command-validate');


// @param {Object} options {
// - cwd        : {string}
// - export     : {string} absolute url

module.exports = function(options, callback) {
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
        fail(ERROR_MESSAGE.INVALID_VERSION, {
            version: version
        }, callback);
        return;
    }

    var series = [];

    series.push(function(done) {

        // check if the current module version is available
        npm.exists(name, version, function(error, data) {
            done();

            if(error){
                warn('NPM server error, skip checking name and version: ' + error);

            }else{
                if(data.exists){
                    fail(ERROR_MESSAGE.MODULE_VERSION_EXISTS, {
                        name: name,
                        version: version
                    }, callback);
                }
            }
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
                    return warn( lang.template('NPM server error, skip checking dependency "{name}@{version}"', {
                        name: dep,
                        version: dep_version
                    }) );

                }

                if(data.exists){
                    exact_dependencies[dep] = data.latest;
                
                }else{
                    fail(ERROR_MESSAGE.MODULE_DEPS_UNEXISTED, {
                        name: dep,
                        version: dep_version 

                    }, callback);
                }
            });
        });
    });

    async.series(series, function() {
        var data = {};

        if(export_file){

            // not override existed data of "package.json"
            if(fs.exists()){
                data = fs.readJSON(export_file);
            }

            data.cortexExactDependencies = lang.mix(data.cortexExactDependencies || {}, exact_dependencies);

            fs.write(export_file, JSON.stringify(data, null, 4));
        }

        process.stdout.write('Validation succeeded.\n');

        callback && callback();
    });

};
