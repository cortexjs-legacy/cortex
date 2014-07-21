'use strict';

var server    = exports;
var node_path = require('path');
var util      = require('util');
var http      = require('http');
var request   = require('request');
var express   = require('express');
var makeArray = require('make-array');


server.run = function(options, callback) {
  options.port = options.port || this.profile.get('service_port');

  var app = express();
  var server = http.createServer(app);
  var logger = this.logger;
  var self = this;

  server.on('error', function(e) {
    if (e.code === 'EADDRINUSE') {
      return callback('Port "' + options.port + '" is {{red ALREADY}} in use !');
    } else {
      return callback(e);
    }
  });

  server.listen(options.port, function() {
    self.createAction(app, 'command', options);
    self.createAction(app, 'kill', options);
    self.createAction(app, 'static', options);

    logger.info('cortex server {{cyan started}} at "localhost:' + options.port + '" !');
    callback(null);
  });
};


// create a server
// @param {Object} options
// - port: {number}
// - method: {string}
// - callback: {Array.<function()>|function()} array of express middlewares
// - route: {string='/'} 
// - route_def: {Object=}
server.createAction = function(app, name, options) {
  var action_path = node_path.join(__dirname, '..', 'service', name);
  var config = require(action_path);

  if (typeof config === 'function') {
    config = config(options);
  }

  var method = config.method.toLowerCase();

  makeArray(config.middleware).forEach(function(callback) {
    app[method](config.route || '/', callback);
  });

  if (options.open && config.open) {
    config.open('http://localhost:' + options.port);
  }
};
