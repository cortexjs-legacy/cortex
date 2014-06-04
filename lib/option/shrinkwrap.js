'use strict';

var fse = require('fs-extra');
var option_cwd = require('../util/cwd');

exports.options = {
  cwd: option_cwd,

  dev: {
    type: Boolean,
    info: 'shrinkwrap devDependencies or not.'
  },

  async: {
    type: Boolean,
    default: true,
    info: 'shrinkwrap asyncDependencies or not'
  },

  'enable-prerelease': {
    type: Boolean,
    info: 'whether should accept prerelease version in dependency analysis'
  }
};

exports.info = 'Lock down dependency versions';

exports.usage = '{{name}} shrinkwrap [options]';
