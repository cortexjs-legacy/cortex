'use strict';

var node_path     = require('path');
var node_url    = require('url');
var fs            = require('fs-sync');

exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        info: 'current working directory',
        value: process.cwd()
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