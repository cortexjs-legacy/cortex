'use strict';

var node_path = require('path');
var node_url = require('url');
var pkg_helper = require('../util/package');

exports.shorthands = {
  c: 'cwd',
};

exports.options = {
  cwd: {
    type: node_path,
    default: process.cwd(),
    info: 'specify the current working directory.',
    setter: function(cwd) {
      var done = this.async();
      pkg_helper.repo_root(cwd, function(dir) {
        if (dir === null) {
          return done({
            code: 'ENOREPO',
            message: 'directory "' + cwd + '" is not inside a project.',
            data: {
              cwd: cwd
            }
          });
        }

        done(null, dir);
      });
    }
  },

  force: {
    type: Boolean,
    info: 'if `true`, cortex will force to publishing existing module.'
  },

  // tar: {
  //     type: node_path,
  //     info: 'the tar file to publish, if specified, option `cwd` will be overriden',
  //     setter: function(tar) {
  //         var remain = this.get('remain') || [];
  //         var cwd = this.get('cwd');
  //         var done = this.async();

  //         if(!tar){
  //             if(remain.length){
  //                 tar = remain[0];
  //             }
  //         }

  //         if(!tar){
  //             // `if options.tar` is not specified, `options.cwd` must be the root of a repo 
  //             var dir = pkg_helper.repo_root(cwd);

  //             if(dir === null){
  //                 return done('directory "' + cwd + '" is not inside a project.');
  //             }

  //             this.set('cwd', dir);

  //             return done(null);
  //         }

  //         if(!fs.isPathAbsolute(tar)){
  //             tar = node_path.resolve(cwd, tar);
  //         }

  //         if(!fs.isFile(tar)){
  //             return done('error `tar` parameter: tarball does not exist or is not a file.');
  //         }

  //         done(null, tar);
  //     }
  // },

  prerelease: {
    type: String,
    info: 'if `true`, cortex will publish the current package as a snapshot version.'
  }
};

exports.info = 'Publish a module to npm server';

exports.usage = [
  '{{name}} publish [options]',
  '{{name}} publish <tarball> [options]'
];