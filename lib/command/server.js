'use strict';

var server      = module.exports = {};

var express     = require('express');
var node_path   = require('path');
var app         = require('../service/app');
var request     = require('request');

server.run = function(options, callback) {
    options.port = options.port || this.context.profile.get('service_port');

    // request();
    this._run(options, callback);
};


server._run = function (options, callback) {
    app.start('command', options);
    app.start('kill', options);
    app.start('static', options);

    callback(null);
};

