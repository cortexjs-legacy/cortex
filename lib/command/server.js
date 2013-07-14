'use strict';

var connect         = require('connect');
var node_path       = require('path');
var profile         = require('cortex-profile');

var cwd = process.cwd();

module.exports = function(options, callback) {
    var SERVER_ROOT = profile.option('built_root');
    var SERVER_PATH = '/' + profile.option('server_path');

    var app = connect();
    if(options.local){
        app.use("/" + options.local,connect.static(cwd));
        app.use("/" + options.local,connect.directory(cwd));   
    }
    app.use(SERVER_PATH, connect.static(SERVER_ROOT));
    app.use(SERVER_PATH, connect.directory(SERVER_ROOT));

    app.listen(options.port, function() {
        var url = 'http://localhost:' + options.port + SERVER_PATH;

        process.stdout.write('Cortex server started at ' + url + '\n');
        options.open && require('child_process').exec('open ' + url);
        callback && callback()
    });
};