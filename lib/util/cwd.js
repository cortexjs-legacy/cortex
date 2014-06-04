'use strict';

var pkg_helper = require('./package');
var node_path = require('path');

// @this comfort setter
module.exports = {
  setter: function(cwd) {
    var done = this.async();
    pkg_helper.repo_root(cwd, function(dir) {
      if (dir === null) {
        return done({
          code: 'INVALID_CWD',
          message: 'directory "' + cwd + '" is not inside a project.',
          data: {
            cwd: cwd
          }
        });
      }

      done(null, dir);
    });
  },

  default: process.cwd(),
  info: 'specify the current working directory.',
  type: node_path
};