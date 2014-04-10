'use strict';

var profile = require('./config/profile');
var express = require('express');
var open = require('open');

var SERVER_ROOT = profile.get('built_root');
var SERVER_PATH = profile.get('server_path');


module.exports = function(options) {
  return {
    route: SERVER_PATH,
    middleware: [
      express.static(SERVER_ROOT),
      express.directory(SERVER_ROOT),
      require('./middleware/auto-install')(SERVER_ROOT),
      require('./middleware/fallback')(options.fallback)
    ],
    method: 'use',

    open: function(root) {
      open(root + SERVER_PATH);
    }
  };
};