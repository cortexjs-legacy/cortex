'use strict';

var connect     = require('connect');
var node_path   = require('path');
var profile     = require('cortex-profile');
var i18n        = require('../i18n');
var MESSAGE     = i18n.require('command-server');
var logger      = require('../logger');

var cwd = process.cwd();

var SERVER_ROOT = profile.option('built_root');
var SERVER_PATH = '/' + profile.option('server_path');

module.exports = function(options, callback) {
    var app = connect();
    if(options.local){
        app.use("/" + options.local,connect.static(cwd));
        app.use("/" + options.local,connect.directory(cwd));   
    }
    app.use(SERVER_PATH, connect.static(SERVER_ROOT));
    app.use(SERVER_PATH, connect.directory(SERVER_ROOT));

    app.listen(options.port, function() {
        var url = 'http://localhost:' + options.port + SERVER_PATH;

        logger.info( logger.template(MESSAGE.SERVER_STARTED, {
            url: url
        }) );

        options.open && require('child_process').exec('open ' + url);
        callback && callback()
    });
};