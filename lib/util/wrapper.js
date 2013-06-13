'use strict';

var lang = require('./lang');

// wrap a commonjs module according to neuron

// @param {Object} options
//  - code  {string} 
//  - deps  {Array.<string>} deps
//  - id    {Object} package.json object
module.exports = function(options) {

    options.deps = options.deps.length ? "'" + options.deps.join("', '") + "'" : '';
    options.code = options.code.replace(/\r|\n/g, '\n');

    return lang.template("{define}('{id}', [{deps}], function(require, exports, module) {\n\n"
        + "{code}\n\n" + 

    "});", options);
};





