'use strict';

var dh = require('../lib/util/deps');
var assert = require('assert');
var expect = require('chai').expect;
var util = require('util');

var pkg_undefined = {
};

var pkg_dep = {
  dependencies: {
    a: '1.1.0'
  }
};

var pkg_deps = {
  dependencies: {
    a: '1.1.0'
  },
  devDependencies: {
    b: '1.1.1'
  },
  asyncDependencies: {
    c: '1.1.2',
    a: '1.1.0'
  },
  engines: {
    d: '1.1.3'
  }
};

var pk = dh.PRODUCTION_DEP_KEYS;
var npk = dh.NON_PRODUCTION_DEP_KEYS;
var gn = dh.get_dep_names;
var gd = dh.get_deps;

var cases = [
  [gn, pkg_undefined, pk, [], 1],
  [gn, pkg_undefined, npk, [], 2],
  [gn, pkg_dep, pk, ['a'], 3],
  [gn, pkg_dep, npk, ['a'], 4],
  [gn, pkg_deps, pk, ['a', 'c', 'd'], 'production'],
  [gn, pkg_deps, npk, ['a', 'b', 'c', 'd'], 'non-production'],
  [gd, pkg_undefined, pk, {}, 5],
  [gd, pkg_undefined, npk, {}, 6],
  [gd, pkg_dep, pk, {a: '1.1.0'}, 7],
  [gd, pkg_dep, npk, {a: '1.1.0'}, 8],
  [gd, pkg_deps, pk, {
    a: '1.1.0',
    c: '1.1.2',
    d: '1.1.3'
  }, 'later will not override former, production'],
  [gd, pkg_deps, npk, {
    a: '1.1.0',
    b: '1.1.1',
    c: '1.1.2',
    d: '1.1.3'
  }, 'later will not override former, non-production'],
];

describe("deps", function(){
  cases.forEach(function (c) {
    it(c[4], function(){
      var ex = c[3];
      if (util.isArray(ex)) {
        expect(c[0](c[1], c[2]).sort()).to.deep.equal(ex.sort());
      } else {
        expect(c[0](c[1], c[2])).to.deep.equal(ex);
      }
    });
  });
});
