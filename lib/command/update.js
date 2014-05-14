'use strict';

var update    = exports;
var node_path = require('path');


// @param {Object} options
// - cwd: {path}
// - modules: {Array.<string>}
update.run = function(options, callback) {
  var commander = this.commander;

  // mock process.argv
  var argv = [
    '', '',
    'install'
  ];

  if (options.modules) {
    argv.push('--modules', options.modules);
  }

  if (options.cwd) {
    argv.push('--cwd', options.cwd);
  }


  commander.parse(argv, function(err, result, details) {
    if (err) {
      return callback(err);
    }

    var opt = result.opt;
    opt.desc = 'updating';

    // exec cortex.commands.build method
    commander.run('install', opt, callback);
  });
};