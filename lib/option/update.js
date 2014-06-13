'use strict';

var node_path   = require('path');
var node_url    = require('url');

exports.shorthands = {
  c: 'cwd',

};

exports.options = {
  cwd: {
    type: node_path,
    default: process.cwd(),
    info: 'specify the current working directory.'
  },

  packages: {
    enumerable: false,
    type: String,
    info: 'the name(s) of the module(s) to be updated.',
    setter: function(packages) {
      if (!packages) {
        packages = this.get('_').shift();
      }

      return packages;
    }
  },

  latest: {
    type: Boolean,
    info: 'update all dependencies to the latest',
    validator: function (value) {
      var done = this.async();
      if (this.get('packages')) {
        return done('`--latest` with specified package(s) makes no sense.\n\n' + usage());
      }

      done(null);
    }
  }
};

exports.info = 'Update a package, packages, or the dependencies of a specific package.';

function usage () {
  return '{{bold Usage:}}\n' + exports.usage.join('\n');
}

exports.usage = [
  'cortex update [dep] [dep]...: update specified package(s)',
  'cortex update               : update dependencies of the current package',
  'cortex update --latest      : update dependencies to the latest and save'
];
