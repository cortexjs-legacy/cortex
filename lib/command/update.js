'use strict';

var update      = module.exports = {};

var node_path   = require('path');


// @param {Object} options
// - cwd: {path}
// - modules: {Array.<string>}
update.run = function(options, callback) {
    options.save = true;
    options.desc = 'updating';

    this.context.commander.run('install', options, callback);
};