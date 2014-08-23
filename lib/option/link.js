'use strict';

var option_cwd  = require('../util/cwd');
var fse = require('fs-extra');
var node_path = require('path');


exports.shorthands = {
  c: 'cwd'
};

exports.options = {
  // cortex build abc
  cwd: option_cwd,

  packages: {
    enumerable: false,
    type: String,
    set: function (value) {
      var done = this.async();

      value = value
        ? value.split(',').map(function (p) {
          return p.trim();
        }).filter(Boolean)
        : [];

      if (!value.length) {
        value = this.get('_');
      }

      if (!value.length) {
        return done({
          code: 'NO_LINK',
          message: 'You must specify the packages to link'
        });
      }

      done(null, value);
    }
  }
};

exports.info = 'Symlink a dependency to the global package folder.';

exports.usage = [
  '{{name}} link pkg [pkg ...]',
  '',
  'Where <pkg> should be <name>@<version>'
];
