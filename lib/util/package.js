// utility tools for package.json

'use strict';

var fs          = require('fs-sync');
var node_path   = require('path');
var readPkgJSON = require('read-package-json');
var lang        = require('./lang');


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

    lang.mix(cortex, pkg, false);
    delete cortex.cortex;

    return {
        err: null,
        pkg: pkg,
        cortex: cortex
    };
};


exports.enhanced_package_json = function (file, callback) {
    readPkgJSON(file, callback);
};


exports.package_styles = function (cwd, pkg) {
    var directories_css = lang.object_member_by_namespaces(pkg, 'cortex.directories.css', 'css');
    var styles;
    var dir;

    if ( directories_css && fs.isDir(dir = node_path.join(cwd, directories_css)) ) {
        styles = fs.expand('**/*.css', {
            cwd: dir
        });
    }

    return styles || [];
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


// @param {Object} options
// - name
// - cache_root
// @param {fuction(err, json)} callback

// TODO: cache_root, try to make build tasks profile-irrelevant
exports.get_module_document = function (options, callback) {
    var document_file = node_path.join(options.cache_root, options.name, 'document.json');

    var json;

    if ( fs.exists(document_file) ) {
        try {
            json = fs.readJSON(document_file);
        } catch(e) {
            
        }
    }

    callback(null, json || {});
};



