'use strict';

var node_path   = require('path');
var node_url    = require('url');
var pkg_helper  = require('../util/package');

exports.shorthands = {
    c: 'cwd'
};

exports.options = {
    cwd: {
        type: node_path,
        info: 'current working directories.',
        setter: function (cwd) {
            var done = this.async();
            var error;

            var dirs = cwd ? 
                cwd.split(',').map(function (c) {
                    return node_path.resolve(c);
                }) :

                [ process.cwd() ];

            dirs.map(function (dir) {
                var root = pkg_helper.repo_root(dir);

                if(root === null){
                    error = 'directory "' + dir + '" is not inside a project.';
                }

                return root;
            });

            if ( error ) {
                return done(error);
            }

            done(null, dirs);
        }
    },

    stop: {
        type: Boolean,
        info: 'with "--stop", cortex will unwatch directories.',
        default: false
    }
};

exports.info = 'Rebuild the current repository whenever watched files change.';

exports.usage = '{{name}} watch [options]';