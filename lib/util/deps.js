'use strict';

// helpers for dependencies
var mix = require('mix2');

var PRODUCTION_DEP_KEYS = ['asyncDependencies', 'dependencies'];
var NON_PRODUCTION_DEP_KEYS = ['devDependencies', 'asyncDependencies', 'dependencies'];

exports.PRODUCTION_DEP_KEYS = PRODUCTION_DEP_KEYS;
exports.NON_PRODUCTION_DEP_KEYS = NON_PRODUCTION_DEP_KEYS;

exports.get_dep_names = function (pkg, keys) {
  return Object.keys(exports.get_deps(pkg, keys));
};


exports.get_deps = function (pkg, keys) {
  var deps = {};
  keys.forEach(function (key) {
    var d = pkg[key];
    if (!d) {
      return;
    }

    mix(deps, d);
  });

  return deps;
};
