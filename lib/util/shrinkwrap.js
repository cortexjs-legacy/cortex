'use strict';

module.exports = shrinkwrap;

var node_path = require('path');
var fs = require('fs');

// @this commander
function shrinkwrap (cwd, callback) {
  var shrinkwrap_json = node_path.join(cwd, 'cortex-shrinkwrap.json');
  var self = this;

  fs.exists(shrinkwrap_json, function (exists) {
    // if cortex-shrinkwrap.json does not exist, skip updating
    if (!exists) {
      return callback(null);
    }

    // mock process.argv
    var argv = [
      '', '',
      'shrinkwrap',
      '--cwd', cwd
    ];

    self.commander.run(argv, callback);
  });
};