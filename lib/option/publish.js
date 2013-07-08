'use strict';

var node_path   = require('path');
var node_url    = require('url');
var profile     = require('cortex-profile');
var fs          = require('fs-sync');


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
        value: function(tar, parsed) {
            if(!tar){
                if(parsed.argv.remain.length){
                    tar = parsed.argv.remain[0];
                }
            }

            if(!tar){
                return null;
            }

            if(!fs.isPathAbsolute(tar)){
                tar = node_path.resolve(parsed.cwd, tar);
            }

            if(!fs.isFile(tar)){
                process.stdout.write('error `tar` parameter: `tar` does not exist or is not a file.\n');
                process.exit(1);
            }

            return tar;
        }
    },

    registry: {
        type: node_url,
        info: 'remote registry service, which could be configured in .cortexrc(.js) file',
        value: profile.option('registry')
    }
};

exports.info = 'Publish a module to npm server';

exports.usage = [
    '{{name}} publish [options]',
    '{{name}} publish <tarfile> [options]'
];