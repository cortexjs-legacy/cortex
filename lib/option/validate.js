'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var pkg_helper  = require('../util/package');

exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        info: 'current working directory',
        value: function (cwd, parsed, tools) {
            if(!cwd){
                cwd = process.cwd();
            }

            var dir = pkg_helper.repo_root(cwd);

            if(dir === null){
                return tools.error('directory "' + cwd + '" is not inside a project.');
            }

            return dir;
        }
    },

    'export': {
        type: node_path,
        short: 'e',
        info: '"{{name}} validate" will save the exact version of dependencies into "cortexExactDependencies" of the `export` file. default to the package.json in `cwd`.',
        value: function(path, parsed) {
            if(!path){
                path = 'package.json';
            }

            return fs.isPathAbsolute(path) ? path : node_path.join(parsed.cwd, path);
        }
    }
};

exports.info = 'Validate package.json according to npm server';

exports.usage = '{{name}} validate [options]';