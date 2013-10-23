'use strict';

var profile = require('../../lib/profile');

module.exports = profile().on('error', function (err) {
    process.stdout.write('\u001b[41m\u001b[37mWARNING\u001b[0m ' + err.message + ':\n');
    process.stdout.write('  - fix the file manually: "cortex config -e"\n');
    process.stdout.write('  - or reset it: "cortex config --unset-all".\n\n');

}).init();