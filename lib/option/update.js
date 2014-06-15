'use strict';

var node_path   = require('path');
var node_url    = require('url');
var option_cwd  = require('../util/cwd');
var cortex_json = require('read-cortex-json');
var deps_helper = require('../util/deps');

exports.shorthands = {
  c: 'cwd',
  l: 'latest'
};

exports.options = {
  cwd: {
    type: node_path,
    default: process.cwd(),
    info: 'specify the current working directory.',
    setter: option_cwd
  },

  packages: {
    enumerable: false,
    info: 'the name(s) of the module(s) to be updated.',
    setter: function(packages) {
      var done = this.async();

      function invalid_option () {
        done({
          code: 'ERROR_UPDATE_OPT_PACKAGES',
          message: 'Error usage of --packages.\n\n'
        });
      }

      if (!packages) {
        packages = this.get('_');

      // cortex update --packages a,b,c,
      } else {

        // invalid usage:
        // cortex update --packages
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

        // cortex update
        // -> find packages from cortex.json
        if (!packages.length) {
          packages = Object.keys(deps);

        // cortex update a b c
        // cortex update --package a,b,c,
        } else {
          var pass = packages.every(function (p) {
            if (p in deps) {
              return true;
            }

            done({
              code: 'UPDATE_PKG_NOT_FOUND',
              message: '"' + p + '" is not a dependency or engine of current package.',
              data: {
                name: p
              }
            });
          });

          if (!pass) {
            return;
          }
        }

        done(null, packages);
      });
    }
  },

  latest: {
    type: Boolean,
    info: 'update dependencie(s) to the latest'
  }
};

exports.info = 'Update a package, packages, or the dependencies of a specific package.';

exports.usage = [
  'cortex update [--latest]         : update all dependencies of the current package',
  'cortex update [dep...] [--latest]: update specified package(s)'
];
