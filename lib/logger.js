'use strict';

var loggie = require('loggie');

// get all flags from `process.env` 
var logger = module.exports = loggie({

    // export CORTEX_LOG_LEVEL=debug,info,error,warn
    level: process.env['CORTEX_LOG_LEVEL'] ||

        // log level of production 
        ['info', 'error', 'warn'],

    // if the current process exit before `logger.end()` called, there will throw an error message
    use_exit: false

}).on('end', function() {
    // do nothing
});


// if `logger.error` called, process will exit with a code of failure
after(logger, 'error', function() {
    process.exit(1);
});


function after(host, name, method){
    var origin = host[name];

    host[name] = function() {
        var ret = origin.apply(this, arguments);
        method.apply(this, arguments);  

        return ret;
    };
};