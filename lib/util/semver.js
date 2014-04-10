'use strict';

var semver = require('semver');

var helper = exports;

helper.remove_prerelease = function(version) {
  var parsed_semver = helper.parse(version);

  return [parsed_semver.major, parsed_semver.minor, parsed_semver.patch].join('.');
};


// '1.2.3' -> '~1.2.0'
helper.get_base_range = function(version) {
  var parsed_semver = helper.parse(version);

  return ['~' + parsed_semver.major, parsed_semver.minor, 0].join('.');
};


helper.parse = function(version) {
  if (Object(version) !== version) {
    version = semver.parse(version);
  }

  return version;
};