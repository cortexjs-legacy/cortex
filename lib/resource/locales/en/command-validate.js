'use strict';

// Yep, I hate JSON. I DO WANT annotations!
module.exports = {
  MODULE_VERSION_EXISTS: 'Module "{{name}}" with version "{{version}}" all ready exists, please update `version` in package.json. Or you could use "SNAPSHOT" version',
  INVALID_VERSION: 'Invalid module version "{{version}}", you should use an exact value',
  MODULE_DEPS_UNEXISTED: 'Dependency "{{name}}@{{version}}" is not existed',
  PACKAGE_NOT_SPECIFIED: 'No package was specified'
};