'use strict';

var update    = exports;
var node_path = require('path');


// @param {Object} options
// - cwd: {path}
// - packages: {Array.<string>}
update.run = function(options, callback) {
  var commander = this.commander;

  // mock process.argv
  var argv = [
    '', '',
    'install'
  ];

  if (options.packages) {
    argv.push('--packages', options.packages);
  }

  if (options.cwd) {
    argv.push('--cwd', options.cwd);
  }


  commander.parse(argv, function(err, result, details) {
    if (err) {
      return callback(err);
    }

    var opt = result.options;
    options.desc = 'updating';

    // exec cortex.commands.build method
    commander.command('install', opt, callback);
  });
};