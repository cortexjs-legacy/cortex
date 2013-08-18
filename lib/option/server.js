'use strict';

var node_path = require('path');
var profile = require('../profile');


exports.options = {
    port: {
        short: 'p',
        type: Number,
        info: 'server port.'
    },

    open: {
        type: Boolean,
        info: 'if `true`, your browser will automatically open cortex server root when started.',
        value: true
    }
};

exports.info = 'Start cortex server';

exports.usage = '{{name}} server [options]';
