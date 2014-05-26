'use strict';

var node_path   = require('path');
var node_url    = require('url');
var pkg_helper  = require('../util/package');

exports.shorthands = {
  c: 'cwd'
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
  }
};

exports.info = 'Update a package, packages, or the dependencies of a specific package.';

exports.usage = [
  '{{name}} update [dep] [dep]...',
  '{{name}} update'
];