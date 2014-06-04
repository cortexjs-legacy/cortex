'use strict';

var node_path   = require('path');
var option_cwd  = require('../util/cwd');

exports.shorthands = {
  c: 'cwd',
};

exports.options = {
  // cortex build abc
  cwd: option_cwd,

  // `root-cwd` is an option to tell cortex build command
  // where did the current user invoke cortex command.
  'entry-cwd': {
    enumerable: false,
    type: node_path,
    setter: function(cwd, is_default) {
      if (!cwd && is_default) {
        cwd = this.get('cwd');
      }

      return cwd;
    }
  },

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
  }
};


exports.info = 'Build module wrapper, and publish to cortex server root.';

exports.usage = [
  '{{name}} build [options]'
];