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

  prerelease: {
    type: String,
    info: 'if `true`, cortex will publish the current package as a snapshot version.'
  }
};

exports.info = 'Publish a module to npm server';

exports.usage = [
  '{{name}} publish [options]'
];