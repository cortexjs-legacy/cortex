'use strict';

var profile = require('./profile');

// ./resources/locales/zh_CN/
var root = './resource/locales/' + profile.option('language') + '/';

// @param {string} relative module name
exports.require = function(module) {
    return require(root + module);
};