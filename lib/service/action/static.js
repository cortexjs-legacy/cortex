'use strict';

var profile     = require('../profile');
var express     = require('express');

var SERVER_ROOT = profile.option('built_root');
var SERVER_PATH = profile.option('server_path');


module.exports = {
    route: SERVER_PATH,
    callback: [
        express.static(SERVER_ROOT),
        express.directory(SERVER_ROOT),
        require('../install_not_found')(SERVER_ROOT,SERVER_PATH)
    ],
    method: 'use',

    open: function (root) {
        require('child_process').exec('open ' + root + SERVER_PATH);
    }
};