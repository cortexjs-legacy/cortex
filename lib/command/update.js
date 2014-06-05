'use strict';

var update    = exports;
var node_path = require('path');
var shrinkwrap    = require('../util/shrinkwrap');

// @param {Object} options
// - cwd: {path}
// - packages: {Array.<string>}
update.run = function(options, callback) {
  var commander = this.commander;

  // mock process.argv
  var argv = [
    '', '',
    'install',
    '--_update'
  ];

  if (options.packages) {
    argv.push('--packages', options.packages);
  }

  if (options.cwd) {
    argv.push('--cwd', options.cwd);
  }

  var self = this;
  commander.parse(argv, function(err, result, details) {
    if (err) {
      return callback(err);
    }

    var opt = result.options;
    opt._desc = 'updating';

    // exec cortex.commands.build method
    commander.command('install', opt, function (err) {
      if (err) {
        return callback(err);
      }

      self.update_shrinkwrap(options, callback);
    });
  });
};


update.update_shrinkwrap = function (options, callback) {
  shrinkwrap.call(this, options.cwd, callback);
};
