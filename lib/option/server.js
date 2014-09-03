'use strict';

var node_path = require('path');
var node_url  = require('url');
var option_cwd = require('../util/cwd');

exports.shorthands = {
  p: 'port'
};

exports.options = {

  port: {
    enumerable: true,
    type: Number,
    default: 0,
    info: 'server port.'
  },

  open: {
    enumerable: true,
    type: Boolean,
    info: 'if `true`, your browser will automatically open cortex server root when started.',
    default: false
  },

  prerelease: {
    enumerable: false,
    info: 'serve packages whose versions are limited to a certain pre-release.'
  },

  fallback: {
    type: node_url
  }
};

exports.info = 'Start cortex server';

exports.usage = '{{name}} server [options]';
