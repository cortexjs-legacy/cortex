'use strict';

exports.options = {
    force: {
        type: Boolean,
        info: 'if `true`, cortex will force to overriding existing files.'
    },

    watch: {
        type: Boolean,
        info: 'if `true`, cortex will also watch the current directory.',
        default: true
    }
};

exports.info = 'Initialize a repo';

exports.usage = '{{name}} init [--force]';