#!/usr/bin/env node
'use strict';


// wrap a commonjs module according to neuron

// @param {Object} options
//  - code  {string} 
//  - deps  {Array.<string>} deps
//  - id    {Object} package.json object
module.exports = function(options) {

    return  options.define + '(\'' + options.id + '\', [\'' + options.deps.join('\', \'') + '\'], function(require, exports, module) {\n\n' +

                options.code.replace(/\r|\n/g, '\n') + 

            '\n\n});';

};





