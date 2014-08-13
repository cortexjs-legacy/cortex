'use strict';

var node_path   = require('path');
var node_url    = require('url');
var option_cwd  = require('../util/cwd');
var cortex_json = require('read-cortex-json');
var deps_helper = require('../util/deps');

exports.shorthands = {
  c: 'cwd'
};

exports.options = {
  cwd: {
    type: node_path,
    default: process.cwd(),
    info: 'specify the current working directory.',
    set: option_cwd
  },

  packages: {
    enumerable: false,
    info: 'the name(s) of the module(s) to be updated.',
    set: function(packages) {
      var done = this.async();

      function invalid_option () {
        done({
          code: 'ERROR_UPDATE_OPT_PACKAGES',
          message: 'Error usage of option `--packages`.'
        });
      }

      // cortex update
      // cortex update a b
      if (!packages) {
        packages = this.get('_');

      // cortex update --packages a,b,c,
      } else {

        // invalid usage:
        // cortex update --packages
        // cortex update --packages ,
        if (typeof packages !== 'string') {
          return invalid_option();
        }

        packages = packages
          .split(/,/g)
          .map(function (p) {
            return p.trim();
          })
          .filter(Boolean);

        if (!packages.length) {
          return invalid_option();
        }
      }

      var cwd = this.get('cwd');
      cortex_json.read(cwd, function (err, pkg) {
        if (err) {
          return done(err);
        }
        var deps = deps_helper.get_deps(pkg, deps_helper.NON_PRODUCTION_DEP_KEYS);
        var names;

        // cortex update
        // -> find packages from cortex.json
        if (!packages.length) {
          names = Object.keys(deps);

        // cortex update a b c
        // cortex update --package a,b,c,
        } else {
          var pass = packages.every(function (p) {
            if (p in deps) {
              return true;
            }

            done({
              code: 'UPDATE_PKG_NOT_FOUND',
              message: '"' + p + '" is not a dependency of the current package.',
              data: {
                name: p
              }
            });
          });

          if (!pass) {
            return;
          }

          names = packages;
        }

        var ids = exports._get_package_ids(names, deps);
        done(null, ids);
      });
    }
  }
};


exports._get_package_ids = function (names, deps) {
  var ids = names.map(function (name) {
    return name + '@' + deps[name];
  });

  return ids;
}


exports.info = 'Update a dependency or dependencies of the current package.';

exports.usage = [
  'cortex update          : update all dependencies of the current package',
  'cortex update [name...] : update specified package(s)'
];
