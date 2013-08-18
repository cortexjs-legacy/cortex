'use strict';

var server      = module.exports = {};

var express     = require('express');
var node_path   = require('path');
var app         = require('../service/app');

server.run = function(options, callback) {
    var port = options.port || server.context.profile.option('service_port');

    startService('command', port);
    startService('kill', port);
    startService('static', port);
};


function startService(name, port){
    var opt = require( node_path.join(__dirname, '..', 'service', 'action', name) );
    opt.port = port;

    app.create(opt);

    opt.open && opt.open('http://localhost:' + port);
}