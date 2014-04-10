'use strict';

// Yep, I hate JSON. I DO WANT annotations!
module.exports = {
  ANALYSIS_TARBALL: '{{cyan analysis}} tarball: "{{file}}"',
  ERR_EXTRACTION: 'Error extracting "{{file}}", {{error}}',
  COMPRESS_TARBALL: '{{cyan compressing}} directory "{{dir}}" to tarball "{{file}}"',
  ERR_PACKAGING: 'Error packaging "{{dir}}" to "{{file}}", {{error}}',
  FAIL_PARSE_PKG: 'Fail to parsing package.json.',
  NO_PACKAGE_JSON: 'No package.json file found.',
  HAS_PRERELEASE: 'Already has prerelease version, ignoring "--prerelease" option'
};