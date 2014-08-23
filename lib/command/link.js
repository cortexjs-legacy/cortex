'use strict';

var link = exports;

var async = require('async');
var ln    = require('../util/link');
var node_path = require('path');
var fs = require('fs');
var fse = require('fs-extra');

link.run = function(options, callback) {
  async.each(options.packages, function (id, done) {
    this.link(id, options, done);    
  }.bind(this), callback);
};


link.link = function (id, options, callback) {
  var id_path = id.replace('@', node_path.sep);
  var built_root = this.profile.get('built_root');
  var relative_path = node_path.join('neurons', id_path);

  var from = node_path.join(options.cwd, relative_path);
  var to = node_path.join(built_root, id_path);

  var self = this;
  function cb (err) {
    if (err) {
      return callback(err);
    }

    self.logger.info(' {{cyan link}} ' + relative_path + ' -> ' + to);
    callback(null);
  }

  fs.exists(to, function (exists) {
    if (exists) {
      return ln.link(from, to, cb);
    }

    self.logger.warn('The destination folder ' + to + ' does not exists, just mkdir -p');
    fse.ensureDir(to, function (err) {
      if (err) {
        return cb(err);
      }

      ln.link(from, to, cb);
    });
  });
};
