'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var pkg_helper  = require('../util/package');

exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        info: 'current working directories.',
        value: function (cwd, parsed, tools) {
            var dirs = cwd ? 
                cwd.split(',').map(function (c) {
                    return node_path.resolve(c);
                }) :

                [ process.cwd() ];

            dirs.map(function (dir) {
                var root = pkg_helper.repo_root(dir);

                if(root === null){
                    tools.error('directory "' + dir + '" is not inside a project.');
                }

                return root;
            });

            return dirs;
        }
    },

    stop: {
        type: Boolean,
        info: 'with "--stop", cortex will unwatch directories.',
        value: false
    }
};

exports.info = 'Validate package.json according to npm server';

exports.usage = '{{name}} validate [options]';