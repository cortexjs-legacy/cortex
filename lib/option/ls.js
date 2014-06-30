'use strict';

var option_cwd = require('../util/cwd');

exports.shorthands = {
  d: 'depth'
};



exports.options = {
  cwd: option_cwd,
  json: {
    enumerable: true,
    type: Boolean,
    info: "Show information in JSON format."
  },

  depth: {
    enumerable: true,
    type: Number,
    default: 0,
    info: 'Max display depth of the dependency tree, `0` means no limits.'
  },

  pkgs: {
    enumerable: false,
    type: String,
    // command line type: String
    // programmatical type: Array.<string>
    info: 'Only show results to packages named.',
    setter: function(pkgs) {
      var done = this.async();
      if (pkgs) {
        pkgs = pkgs.split(',');
      } else {
        pkgs = [];
      }

      var remains = this.get('_');
      if (remains.length)
        pkgs = pkgs.concat(remains);

      done(null, pkgs);
    }
  }
};


exports.info = 'List installed packages in current project';

exports.usage = [
  '{{name}} ls [<pkg> ...]'
];