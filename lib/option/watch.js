'use strict';

var node_path   = require('path');
var node_url    = require('url');
var async       = require('async');
var cortex_json = require('read-cortex-json');

exports.shorthands = {
  c: 'cwd'
};

exports.options = {
  cwd: {
    type: node_path,
    info: 'current working directories.',
    set: function(cwd) {
      var done = this.async();
      var error;

      var dirs = cwd 
        ? cwd.split(',').map(function(c) {
          return node_path.resolve(c);
        }) 
        : [process.cwd()];

      async.map(dirs, function(dir, callback) {
        cortex_json.package_root(dir, function (root) {
          if (root === null) {
            return callback('directory "' + dir + '" is not inside a project.');
          }

          callback(null, root);
        });

      }, function (err, dirs) {
        if (err) {
          return done(err);
        }

        done(null, dirs);
      });
    }
  },

  stop: {
    type: Boolean,
    info: 'with "--stop", cortex will remove directories out of the watching list.',
    default: false
  },

  'init-build': {
    enumerable: false,
    type: Boolean,
    info: 'whether cortex should build the project when begins to watch.',
    default: true
  },

  prerelease: {
    enumerable: false,
    info: 'build the project as a pre-release package.'
  }

};

exports.info = 'Rebuild the current repository whenever watched files change.';

exports.usage = '{{name}} watch [options]';
