
'use strict';

var semver = require('semver');

var helper = exports;

helper.remove_prerelease = function(version) {
  var parsed_semver = helper.parse(version);

  return [parsed_semver.major, parsed_semver.minor, parsed_semver.patch].join('.');
};


helper.parse = function(version) {
  if (Object(version) !== version) {
    version = semver.parse(version);
  }

  return version;
};
