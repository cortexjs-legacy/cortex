'use strict';

var express     = require('express');
var node_path   = require('path');
var app         = require('../app');
var profile     = require('../profile');

// var i18n        = require('../i18n');
// var MESSAGE     = i18n.require('command-server');


module.exports = function(options, callback) {
    startService('action');
    startService('kill');
    startService('static');
};


function startService(name){
    var port = profile.option('service_port');

    var opt = require( node_path.join(__dirname, '..', 'service', name) );
    opt.port = port;

    app.create(opt);

    opt.open && opt.open('http://localhost:' + port);
}