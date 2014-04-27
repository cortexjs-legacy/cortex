'use strict';

var node_path   = require('path');
var node_url    = require('url');
var async       = require('async');
var pkg_helper  = require('../util/package');

exports.shorthands = {
  c: 'cwd'
};

exports.options = {
  cwd: {
    type: node_path,
    info: 'current working directories.',
    setter: function(cwd) {
      var done = this.async();
      var error;

      var dirs = cwd 
        ? cwd.split(',').map(function(c) {
          return node_path.resolve(c);
        }) 
        : [process.cwd()];

      async.map(dirs, function(dir, callback) {
        pkg_helper.repo_root(dir, function (root) {
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

  'main-cwd': {
    enumerable: false,
    type: node_path,
    setter: function(cwd) {
      if (!cwd) {
        var cwds = this.get('cwd');

        if (cwds.length === 1) {
          cwd = cwds[0];
        }
      }

      return cwd;
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
  }
};

exports.info = 'Rebuild the current repository whenever watched files change.';

exports.usage = '{{name}} watch [options]';