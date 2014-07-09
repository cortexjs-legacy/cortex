'use strict';

var fse = require('fs-extra');
var option_cwd = require('../util/cwd');

exports.options = {
  cwd: option_cwd,

  'stable-only': {
    type: Boolean,
    info: 'whether should accept prerelease version in dependency analysis'
  },

  'with-engines': {
    type: Boolean,
    info: 'whether should include `neuron` in cortex-shrinkwrap.json',
    default: true
  }
};

exports.info = 'Lock down dependency versions';

exports.usage = '{{name}} shrinkwrap [options]';
