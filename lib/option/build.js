'use strict';

var node_path   = require('path');
var fs          = require('fs-sync');
var pkg_helper  = require('../util/package');

var REGEX_ENDS_WITH_JS = '/\.js$/';

exports.shorthands = {
    c: 'cwd',
};

exports.options = {
    // cortex build abc
    cwd: {
        type: node_path,
        info: 'current working directory.',
        default: process.cwd(),

        // `nopt` makes sure `cwd` is an absolute path
        setter: function (cwd) {
            var done = this.async();

            var dir = pkg_helper.repo_root(cwd);

            if(dir === null){
                return done('directory "' + cwd + '" is not inside a project.');
            }

            // get real project root
            done(null, dir);
        }
    },

    ranges: {
        type: Boolean,
        info: 'check ranges and build local files with range pathes.',
        default: true
    },

    dest: {
        type: node_path,

        // default to be profile.built_root
        info: 'the destination directory to be built into'
    }
};


exports.info = 'Build module wrapper, and publish to cortex server root.';

exports.usage = [
    '{{name}} build [options]'
];


