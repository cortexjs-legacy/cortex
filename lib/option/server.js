'use strict';

var node_path = require('path');
var node_url  = require('url');

exports.shorthands = {
  p: 'short'
};

exports.options = {
  port: {
    type: Number,
    info: 'server port.',
    default: 0
  },

  open: {
    type: Boolean,
    info: 'if `true`, your browser will automatically open cortex server root when started.',
    default: false
  },

  fallback: {
    type: node_url
  }
};

exports.info = 'Start cortex server';

exports.usage = '{{name}} server [options]';