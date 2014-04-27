'use strict';

var node_path   = require('path');
var pkg_helper  = require('../util/package');

var AVAILABLE_ACTIONS = [
  'add',
  'rm',
  'ls'
];


var usage = '    cortex owner add <username> <pkg>\n' +
  '    cortex owner rm <username> <pkg>';

function argument_error(option, value) {
  return {
    code: 'EPARSEARG',
    message: 'Invalid arguments, usage:\n' + usage,
    data: {
      usage: usage,
      command: 'owner',
      option: option,
      value: value
    }
  };
}


exports.options = {
  action: {
    enumerable: false,
    type: Boolean,
    info: 'the action to be processed, could be "add", "rm", or, "ls".',
    setter: function(action) {
      var done = this.async();

      if (!action) {
        action = this.get('_').shift();
      }

      if (!~AVAILABLE_ACTIONS.indexOf(action)) {
        done(argument_error('action', action));

      } else {
        done(null, action);
      }
    }
  },

  user: {
    enumerable: false,
    info: 'the user to be added or removed.',
    setter: function(user) {
      var action = this.get('action');
      var done = this.async();

      if (action === 'ls') {
        return done(null);
      }

      if (!user) {
        user = this.get('_').shift();
      }

      if (!user) {
        return done(argument_error('user', user));
      }

      done(null, user);
    }
  },

  cwd: {
    type: node_path,
    info: 'current working directory.',
    default: process.cwd()
  },

  pkg: {
    enumerable: false,
    type: String,
    info: 'the package name',
    setter: function(name) {
      var done = this.async();

      // 'a@0.1.0' -> 'a'
      if (name) {
        return done(null, name.split('@')[0]);
      }

      if (!name) {
        name = this.get('_').shift();
      }

      if (name) {
        return done(null, name);
      }

      pkg_helper.repo_root(this.get('cwd'), function (cwd) {
        if (!cwd) {
          return done({
            code: 'ENOTAREPO',
            message: 'package.json not found, or you might specify a package to add owners.',
            data: {
              cwd: cwd
            }
          });
        }

        // Read local package
        // `cortex owner add kael`
        // try to read package name from package.json
        exports._get_name(cwd, done);
      });
    }
  }
};


exports._get_name = function (cwd, callback) {
  pkg_helper.get_original_package(cwd, function(err, pkg) {
    if (err) {
      return callback(err);
    }

    var pkg_name = pkg.name;

    if (!pkg_name) {
      return callback({
        code: 'ENOPKG',
        message: 'you must specify a package to add owners.'
      });
    }

    callback(null, pkg_name);
  });
};


exports.info = 'Manage package owners';

exports.usage = [
  '{{name}} owner add <username> <pkg>',
  '{{name}} owner rm <username> <pkg>'
];