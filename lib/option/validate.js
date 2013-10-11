'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var pkg_helper  = require('../util/package');

exports.shorthands = {
    c: 'cwd',
    e: 'export'
};

exports.options = {
    cwd: {
        type: node_path,
        info: 'current working directory',
        default: process.cwd(),
        value: function (cwd) {
            var done = this.async();

            var dir = pkg_helper.repo_root(cwd);

            if(dir === null){
                return done('directory "' + cwd + '" is not inside a project.');
            }

            done(null, dir);
        }
    },

    'export': {
        type: node_path,
        info: '"{{name}} validate" will save the exact version of dependencies into "cortexExactDependencies" of the `export` file. default to the package.json in `cwd`.',
        setter: function(path) {
            var cwd = this.get('cwd');

            if(!path){
                path = 'package.json';
            }

            return fs.isPathAbsolute(path) ? path : node_path.join(cwd, path);
        }
    }
};

exports.info = 'Validate package.json according to npm server';

exports.usage = '{{name}} validate [options]';