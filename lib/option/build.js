'use strict';

var node_path   = require('path');
var option_cwd  = require('../util/cwd');

exports.shorthands = {
  c: 'cwd',
};

exports.options = {
  // cortex build abc
  cwd: option_cwd,

  ranges: {
    type: Boolean,
    info: 'check ranges and build local files with range pathes.',
    default: true
  },

  preinstall: {
    enumerable: false,
    type: Boolean,
    default: false
  },

  prebuild: {
    enumerable: false,
    type: Boolean,
    default: true
  },

  dest: {
    type: node_path,

    // default to be profile.built_root
    info: 'the destination directory to be built into'
  },

  link: {
    enumerable: false,
    type: Boolean,
    info: 'link the neurons/ folder to built root.',
    default: true
  }
};


exports.info = 'Build module wrapper, and publish to cortex server root.';

exports.usage = [
  '{{name}} build [options]'
];
