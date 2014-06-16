'use strict';

var update    = exports;
var node_path = require('path');
var shrinkwrap    = require('../util/shrinkwrap');

// @param {Object} options
// - cwd: {path}
// - packages: {Array.<string>}
update.run = function(options, callback) {
  if (!options.packages.length) {
    this.logger.warn('Seems there is no packages to update.');
    return callback(null);
  }

  this.update(options, callback);
};


// update 
update.update = function(options, callback) {
  // mock process.argv
  var argv = [
    '', '',
    'install',
    '--_update',

    // if `cortex install`, only modules defined in cortex-shrinkwrap.json will be installed.
    // so, we must pass `--packages`
    '--packages', options.packages.join(','),
    '--cwd', options.cwd
  ];

  this.run_install(argv, options, callback);
};


update.run_install = function (argv, options, callback) {
  var commander = this.commander;
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

      // TODO:
      // updates specified sub tree of shrinkwrap, related to cortexjs/cortex-shrinkwrap#10
      self.update_shrinkwrap(options, callback);
    });
  });
};


update.update_shrinkwrap = function (options, callback) {
  shrinkwrap.call(this, options.cwd, callback);
};
