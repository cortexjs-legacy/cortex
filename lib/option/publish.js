'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');
var pkg_helper  = require('../util/package');

exports.options = {
    cwd: {
        type: node_path,
        short: 'c',
        value: process.cwd(),

        info: 'specify the current working directory.'
    },

    force: {
        type: Boolean,
        info: 'if `true`, cortex will force to publishing existing module.'
    },

    tar: {
        type: node_path,
        info: 'the tar file to publish, if specified, option `cwd` will be overriden',
        value: function(tar, parsed, tools) {
            var remain;

            if(!tar){
                remain = parsed.argv && parsed.argv.remain || [];

                if(remain.length){
                    tar = remain[0];
                }
            }

            if(!tar){
                // `if options.tar` is not specified, `options.cwd` must be the root of a repo 
                var cwd = parsed.cwd;
                var dir = pkg_helper.repo_root(cwd);

                if(dir === null){
                    tools.error('directory "' + cwd + '" is not inside a project.');
                }

                return null;
            }

            if(!fs.isPathAbsolute(tar)){
                tar = node_path.resolve(parsed.cwd, tar);
            }

            if(!fs.isFile(tar)){
                return tools.error('error `tar` parameter: `tar` does not exist or is not a file.');
            }

            return tar;
        }
    }
};

exports.info = 'Publish a module to npm server';

exports.usage = [
    '{{name}} publish [options]',
    '{{name}} publish <tarfile> [options]'
];