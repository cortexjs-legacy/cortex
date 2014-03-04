'use strict';

var profile     = require('../profile');
var express     = require('express');

var SERVER_ROOT = profile.get('built_root');
var SERVER_PATH = profile.get('server_path');


module.exports = function (options) {
    return {
        route: SERVER_PATH,
        middleware: [
            express.static(SERVER_ROOT),
            express.directory(SERVER_ROOT),
            require('./middleware/auto-install')(SERVER_ROOT),
            require('./middleware/fallback')(options.fallback)
        ],
        method: 'use',

        open: function (root) {
            require('child_process').exec('open ' + root + SERVER_PATH);
        }
    };
};