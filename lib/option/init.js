'use strict';

exports.list = {
    force: {
        type: Boolean,
        info: 'if `true`, cortex will force to overriding existing files.'
    }
};

exports.info = 'Initialize a repo';

exports.usage = 'ctx init [--force]';