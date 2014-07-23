'use strict';

var logger  = require('loggie')();
var profile = require('cortex-profile');

var p = 
module.exports = 
profile({
  codec: 'ini'
})
.on('error', function(err) {
  logger.error(err.stack || err.message || err);
  process.exit(1);
});

p.init();

// User could edit the config file manually, 
// cortex will save and hash the auth info on every start.
p.encrypt();
