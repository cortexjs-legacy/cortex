'use strict';


exports.list = {
    port: {
        short: 'p',
        type: Number,
        info: 'server port.',
        value: 8765
    },

    open: {
        type: Boolean,
        info: 'if `true`, your browser will automatically open cortex server root when started.',
        value: true
    },

    local: {
        type: String,
        info: 'setup a static server under path /local for current working directory.',
        value: "local"
    }
};

exports.info = 'Start cortex server';

exports.usage = '{{name}} server [options]';
