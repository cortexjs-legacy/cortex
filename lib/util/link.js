'use strict';

var fse = require('fs-extra');
var fs = require('fs');
var node_path = require('path');


// Creates a symlink from `from` to `to`.
// If `from` exists, it will remove it.
exports.link = function (from, to, callback) {
  fs.lstat(from, function (err, stat) {
    // not found
    if (err && err.code === 'ENOENT') {
      return link(from, to, callback);
    }

    fse.remove(from, function (err) {
      link(from, to, callback);
    });
  });
};


function link (from, to, callback) {
  var dir = node_path.dirname(from);
  fse.mkdirs(dir, function (err) {
    if (err) {
      return callback(err);
    }
    fs.symlink(to, from, 'dir', callback);
  });
}


exports.just_link = link;
