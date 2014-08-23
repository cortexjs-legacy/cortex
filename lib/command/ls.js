'use strict';

var list = require('cortex-ls');
var ls = exports;

ls.run = function(options, callback) {
  var cwd = options.cwd;
  var pkgs = options.pkgs || [];

  list.print(cwd, {
    depth: options.depth,
    json: options.json,
    filters: pkgs
  }, function(err, output) {
    if (err) return callback(err);

    console.log(output);
  });
};