'use strict';

var profile = require('../profile');

var p = module.exports = profile().on('error', function (err) {
    
}).init();

// User could edit the config file manually, 
// cortex will save and hash the auth info on every start.
p.saveConfig();
