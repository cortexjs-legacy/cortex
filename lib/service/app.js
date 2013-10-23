'use strict';

var express = require('express');
var lang = require('../util/lang');
var logger = require('./logger');

var server = module.exports = {};

server.__apps = {};

// create a server
// @param {Object} options
// - port: {number}
// - method: {string}
// - callback: {Array.<function()>|function()} array of express middlewares
// - route: {string='/'} 
// - route_def: {Object=}
server.create = function (options) {
    var app = server.getApp(options.port);
    var method = options.method.toLowerCase();

    options.route_def && lang.each(options.route_def, function (value, key) {
        app.param(key, value);
    });
    
    lang.makeArray(options.middleware).forEach(function (callback) {
        app[method](options.route || '/', callback);
    });
};


server.getApp = function (port) {
    var app = server.__apps[port];

    if(!app){
        app = server.__apps[port] = express();
        app.listen(port);
        logger.info('server {{cyan started}} at "http://localhost:' + port + '" !');
    }

    return app;
};

