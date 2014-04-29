'use strict';

var node_path   = require('path');
var node_url    = require('url');
var pkg_helper  = require('../util/package');

exports.shorthands = {
  f: 'force',
  c: 'cwd'
};

exports.options = {
  force: {
    type: Boolean,
    info: 'whether to force unpublishing.',
    default: false
  },

  cwd: {
    type: node_path,
    default: process.cwd(),
    info: 'specify the current working directory.'
  },

  pkg: {
    enumerable: false,
    type: String,
    info: 'the package to be unpublished.',

    // cortex unpublish --pkg a
    // cortex unpublish a

    // @returns {Array.<string>} ATTENSION!
    setter: function(module) {
      var done = this.async();

      // cortex unpublish a
      if (!module) {
        var remain = this.get('_');

        if (remain.length) {
          module = remain[0];
        }
      }

      if (module) {
        return done(null, module);
      }

      pkg_helper.repo_root(this.get('cwd'), function (cwd) {
        if (!cwd) {
          return done({
            code: 'ENOTAREPO',
            message: 'package.json not found',
            data: {
              cwd: cwd
            }
          });
        }

        exports._get_name(cwd, done);
      });
    }
  }
};


exports._get_name = function (cwd, callback) {
  // Unpublish all versions of a package
  //      cortex unpublish
  pkg_helper.get_original_package(cwd, function(err, pkg) {
    if (err) {
      return callback(err);
    }

    // if exec `cortex unpublish`, we unpublish all version of the current package
    var pkg_name = pkg.name;

    if (!pkg_name) {
      return callback({
        code: 'ENOPKG',
        message: 'you must specify a package to unpublish.'
      });
    }

    callback(null, pkg_name);
  });
};


exports.info = 'Unpublish a package.';

exports.usage = [
  '{{name}} unpublish [options]',
  '{{name}} unpublish <name>[@<version>] [options]'
];