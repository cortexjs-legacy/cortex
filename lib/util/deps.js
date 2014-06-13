'use strict';

// helpers for dependencies

var PRODUCTION_DEP_KEYS = ['engines', 'dependencies', 'asyncDependencies'];
var NON_PRODUCTION_DEP_KEYS = ['engines', 'dependencies', 'asyncDependencies', 'devDependencies'];

exports.PRODUCTION_DEP_KEYS = PRODUCTION_DEP_KEYS;
exports.NON_PRODUCTION_DEP_KEYS = NON_PRODUCTION_DEP_KEYS;
