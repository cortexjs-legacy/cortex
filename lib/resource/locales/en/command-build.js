'use strict';

// Yep, I hate JSON. I DO WANT annotations!
module.exports = {
  // USE_PARENT_DIRECTORY    : 'Modules "{{path}}" outside the folder of the main module may cause serious further problems.',
  // NO_EXACT_VERSION        : 'Exact version of dependency "{{mod}}" has not defined in package.json. Use "ctx install {{mod}} --save".',
  // SYNTAX_PARSE_ERROR      : 'Source file "{{path}}" syntax parse error: "{{err}}".',
  // FILE_NOT_FOUND          : 'Source file "{{path}}" not found.',
  // ALREADY_WRAPPED         : 'Source file "{{path}}" already has module wrapping, which will cause further problems.',
  // WRONG_USE_REQUIRE       : 'Source file "{{path}}": `require` should have one and only one string as an argument.',
  // NO_ENTRY_POINT          : 'Main file "{{path}}" is not found.',
  // NAME_MUST_BE_DEFINED    : 'package.name must be defined.',
  // VER_MUST_BE_DEFINED     : 'package.version must be defined.',
  BUILDER_MUST_BE_DEFINED: 'package.cortex.builder must be defined.',
  PACKAGE_NOT_FOUNT_ON_NPM: 'package {{name}} not found on registry',
};