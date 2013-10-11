'use strict';

var node_path = require('path');
var profile = require('../profile');


exports.shorthands = {
    p: 'short'
};

exports.options = {
    port: {
        type: Number,
        info: 'server port.'
    },

    open: {
        type: Boolean,
        info: 'if `true`, your browser will automatically open cortex server root when started.',
        default: true
    }
};

exports.info = 'Start cortex server';

exports.usage = '{{name}} server [options]';
