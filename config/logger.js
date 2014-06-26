'use strict';

var loggie  = require('loggie');
var profile = require('./profile');
var util    = require('util');

// get all flags from `process.env` 
var logger  = module.exports = loggie({

  // export CORTEX_LOG_LEVEL=debug,info,error,warn
  level: process.env['CORTEX_LOG_LEVEL'] ||

  // log level of production 
  ['info', 'error', 'fatal', 'warn'],

  // if the current process exit before `logger.end()` called, there will throw an error message
  use_exit: false,
  catch_exception: false,

  colors: profile.get('colors')
});


logger.register('fatal', {
  template: '{{red|bold ERR!}} {{arguments}}'
});


var fatal = logger.fatal;

logger.fatal = function(msg, exit_code) {
  fatal.call(this, msg);
  if (typeof exit_code === 'number') {
    process.exit(exit_code);
  }
};
