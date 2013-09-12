// utility tools for package.json

'use strict';

var fs = require('fs-sync');
var node_path = require('path');
var readPkgJSON = require('read-package-json'); 


// Sync method
// @param {path} cwd
// @param {function(err, data, cortex_data)} callback
exports.get_package_json = function (cwd) {
    var file = node_path.join(cwd, 'package.json');

    if( !fs.exists(file) ){
        return {
            err: '"' + file + '" not found, could not save dependencies'
        };
    }

    var pkg;

    try {
        pkg = fs.readJSON( file );
    } catch(e) {
        return {
            err: e
        };
    }

    var cortex = pkg.cortex || {};

    return {
        err: null,
        pkg: pkg,
        cortex: cortex
    };
};


exports.enhanced_package_json = function (file, callback) {
    readPkgJSON(file, callback);
};


// Get the root path of the project
exports.repo_root = function (cwd) {
    do {
        if(fs.exists(cwd, 'package.json')){
            return cwd;
        }

        cwd = node_path.dirname(cwd);
    
    }while(cwd !== '/');

    return null;
};