'use strict';

var semver = require('semver');

var helper = exports;

helper.remove_prerelease = function(version) {
  var parsed_semver = helper.parse(version);

  return [parsed_semver.major, parsed_semver.minor, parsed_semver.patch].join('.');
};


var STAGES = {
  // check '~' first
  '~': {
    // '1.2.3' -> '1.2'
    equivalent: function (parsed) {
      return [parsed.major, parsed.minor].join('.');
    },
    // '~1.2.0'
    base: function (parsed) {
      return '~' + [parsed.major, parsed.minor, '0'].join('.');
    }
  },
  
  // then '^'
  '^': {
    // '1.2.3' -> '1'
    equivalent: function (parsed) {
      return String(parsed.major);
    },
    // '^1.0.0'
    base: function (parsed) {
      return '^' + parsed.major + '.0.0';
    }
  },

  '*': {
    equivalent: function () {
      return 'latest';
    },
    base: function () {
      return '*';
    }
  }
};

// Gets the latest version of
// - current minor
// - current major
helper.check_version_range = function (parsed, versions, type, iterator) {
  var stage = STAGES[type];
  var equivalent = stage.equivalent(parsed);
  var base_range = stage.base(parsed);
  var max_version = semver.maxSatisfying(versions, base_range);

  // @type {Boolean} to indicate that the current version whether could be the new max
  var passed = 
    // There is no version match the current base range
    !max_version
    // Current version is big enough
    || semver.gte(version, max_version);
  iterator(equivalent, passed);
};


helper.parse = function(version) {
  if (Object(version) !== version) {
    version = semver.parse(version);
  }

  return version;
};
