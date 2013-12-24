'use strict';

var loggie = require('loggie');
var profile = require('./profile');

// get all flags from `process.env` 
var logger = module.exports = loggie({

    // export CORTEX_LOG_LEVEL=debug,info,error,warn
    level: process.env['CORTEX_LOG_LEVEL'] ||

        // log level of production 
        ['info', 'error', 'warn'],

    // if the current process exit before `logger.end()` called, there will throw an error message
    use_exit: false,
    catch_exception: false,

    colors: profile.get('colors')
});

