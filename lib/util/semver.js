
'use strict';

var semver = require('semver-extra');

var helper = exports;

helper.convert_to_range = function(version) {
  var parsed_semver = helper.parse(version);

  var prerelease_removed = [
    parsed_semver.major,
    parsed_semver.minor,
    parsed_semver.patch
  ].join('.');

  return parsed_semver.major
    // semver.satisfies('0.1.3-beta', '^0.1.3') -> true
    ? '^' + prerelease_removed

    // semver.satisfies('0.0.3-beta', '^0.0.3') -> false
    // semver.satisfies('0.0.3-beta', '~0.0.3') -> true
    : '~' + prerelease_removed;
};


helper.parse = function(version) {
  if (Object(version) !== version) {
    version = semver.parse(version);
  }

  return version;
};
