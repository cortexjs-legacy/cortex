'use strict';

var server      = exports;

var node_path   = require('path');
var util        = require('util');
var request     = require('request');
var express     = require('express');
var lang        = require('../util/lang');


server.run = function(options, callback) {
    options.port = options.port || this.context.profile.get('service_port');

    // request();
    this._run(options, callback);
};


server._run = function (options, callback) {
    var app = express();
    app.listen(options.port);

    this.createAction(app, 'command', options);
    this.createAction(app, 'kill', options);
    this.createAction(app, 'static', options);

    callback(null);
};


// create a server
// @param {Object} options
// - port: {number}
// - method: {string}
// - callback: {Array.<function()>|function()} array of express middlewares
// - route: {string='/'} 
// - route_def: {Object=}
server.createAction = function (app, name, options) {
    var action_path = node_path.join(__dirname, '..', 'service', name);
    var config = require(action_path);

    if ( util.isFunction(config) ) {
        config = config(options);
    }

    var method = config.method.toLowerCase();
    
    lang.makeArray(config.middleware).forEach(function (callback) {
        app[method](config.route || '/', callback);
    });

    if ( options.open && config.open ) {
        config.open('http://localhost:' + options.port);
    }
};

