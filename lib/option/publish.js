'use strict';

var node_url = require('url');
var option_cwd = require('../util/cwd');

exports.shorthands = {
  c: 'cwd',
};

exports.options = {
  cwd: option_cwd,

  force: {
    type: Boolean,
    info: 'if `true`, cortex will force to publishing existing module.'
  },

  prerelease: {
    type: String,
    info: 'Publish as a prerelease version.'
  },

  prepublish: {
    enumerable: false,
    type: Boolean,
    default: true
  }
};

exports.info = 'Publish a module to npm server';

exports.usage = [
  '{{name}} publish [options]'
];