'use strict';

var profile = require('cortex-profile');

var p = module.exports = profile().on('error', function(err) {
  process.stdout.write('\u001b[41m\u001b[37mWARNING\u001b[0m ' + err.message + ':\n');
  process.stdout.write('  - fix the file manually: "cortex config edit"\n');
  process.stdout.write('  - or reset it: "cortex config delete --delete-all".\n\n');

}).init();

// User could edit the config file manually, 
// cortex will save and hash the auth info on every start.

// do not encrypt when called as http request
// p.encrypt().save();