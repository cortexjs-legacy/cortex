#! /usr/bin/env node


var Fiber = require('fiber'),
   npm = require('npm');

// use fiber translate

npm.load({
    'userconfig':'.npmrc'
});

var npmw = module.exports = npm;


