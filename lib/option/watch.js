'use strict';

var node_path     = require('path');
var node_url    = require('url');
var fs            = require('fs-sync');

exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        info: 'current working directories.',
        value: function (cwd) {
            return cwd ? cwd.split(',').map(function (c) {
                    return node_path.resolve(c);
                }) :

                [ process.cwd() ];
        }
    },

    stop: {
        type: Boolean,
        info: 'with "--stop", cortex will unwatch directories.'
        value: true
    }
};

exports.info = 'Validate package.json according to npm server';

exports.usage = '{{name}} validate [options]';