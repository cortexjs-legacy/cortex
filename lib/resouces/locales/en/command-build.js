'use strict';

// Yep, I hate JSON. I DO WANT annotations!
module.exports = {
    USE_PARENT_DIRECTORY    : 'Modules "{{mod}}" outside the folder of the main module may cause serious further problems.',
    NO_VERSION              : 'Exact version of dependency "{{mod}}" has not defined in package.json. Use "ctx install {{mod}} --save".',
    SYNTAX_PARSE_ERROR      :  'Source file "{{path}}" syntax parse error: "{{err}}".',
    NOT_FOUND               : 'Source file "{{path}}" not found.',
    ALREADY_WRAPPED         : 'Source file "{{path}}" already has module wrapping, which will cause further problems.',
    WRONG_USE_REQUIRE       : 'Source file "{{path}}": `require` should have one and only one string as an argument.',
    NO_PACKAGE_MAIN         : 'Property "main" not found in package.json. Fallback to ./index.js.',
    NAME_MUST_BE_DEFINED    : 'package.name must be defined.',
    VER_MUST_BE_DEFINED     : 'package.version must be defined.',
    
};