'use strict';

var profile = require('cortex-profile');

// ./resources/locales/zh_CN/
var root = './resources/locales/' + profile.option('language') + '/';

// @param {string} relative module name
exports.require = function(module) {
    return require(root + module);
};