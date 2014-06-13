'use strict';

// helpers for dependencies
var lang = require('./lang');

var PRODUCTION_DEP_KEYS = ['engines', 'dependencies', 'asyncDependencies'];
var NON_PRODUCTION_DEP_KEYS = ['engines', 'dependencies', 'asyncDependencies', 'devDependencies'];

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

    lang.mix(deps, d);
  });

  return deps;
};
