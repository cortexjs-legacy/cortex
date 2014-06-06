'use strict';

var cortex_json = require('read-cortex-json');
var node_path = require('path');

// @this comfort setter
module.exports = {
  setter: function(cwd) {
    var done = this.async();
    cortex_json.package_root(cwd, function(dir) {
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