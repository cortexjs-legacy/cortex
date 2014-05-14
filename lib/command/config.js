'use strict';

var config    = exports;
var editor    = require('editor');
var node_path = require('path');
var asks      = require('asks');

// @param {Object} options see 'lib/option/config.js' for details
config.run = function(options, callback) {
  options.writable = this.profile.writable();
  options.enumerable = this.profile.enumerable();

  var sub = options['sub-command'];

  this[sub](options, callback);
};


config.list = function(options, callback) {
  var logger = this.logger;

  logger.info('{{bold Available options:}}');

  options.enumerable.forEach(function(name) {
    if (~options.writable.indexOf(name)) {
      logger.info('   -', name);
    }
  });

  callback(null);
};


config.edit = function(options, callback) {
  var conf = node_path.resolve(this.profile.get('profile_root'), 'config.js');
  var self = this;
  editor(conf, function(code, signal) {
    var status = code 
      ? '({{red failure}})'
      : '({{green success}})';

    self.logger.info('{{cyan Finished}} editing with code', code, status);
    callback(code && 'Unknown error.');
  });
};


config.set = function(options, callback) {
  var name = options.key;

  if (options.value === undefined) {
    if (options._http) {
      return callback('"value" should be specified.');
    }

    var logger = this.logger;
    var value = this.profile.get(name);
    var schema = {
      name: 'value',
      message: 'value',
      type: options.key === 'password' ? 'password' : 'input'
    };

    if (value) {
      schema.default = value;
    }

    var self = this;

    asks.prompt(schema, function(result) {
      options.value = result.value;
      self._set(options, callback);
    });

  } else {
    this._set(options, callback);
  }
};


config.get = function (options, callback) {
  var name = options.key;

  if (!~options.enumerable.indexOf(name)) {
    return callback({
      code: 'ENOTENUM',
      message: '"' + name + '" is an invalid config name or not enumerable',
      data: {
        name: name
      }
    });
  }

  var value = this.profile.get(name);
  this.logger.info(value);
}

config._set = function(options, callback) {
  var profile = this.profile;
  var name = options.key;

  if (!~options.writable.indexOf(name)) {
    return callback({
      code: 'ENOTWRITABLE',
      message: '"' + name + '" is not writable or is an invalid config name. See "cortex config list".',
      data: {
        name: name
      }
    });
  }

  if (!profile.set(name, options.value)) {
    return callback('Fail to save "' + name + '".');
  }

  profile.save();
  callback(null);
};


config.delete = function(options, callback) {
  var profile = this.profile;
  var name = options.key;

  if (options['delete-all']) {
    return this._unset(options.writable, callback);
  }

  if (!~options.writable.indexOf(name)) {
    return callback('Invalid option "' + name + '".');
  }

  this._unset([name], callback);
};


// unset a config of configs back to default
config._unset = function(unsets, callback) {
  var profile = this.profile;
  unsets.forEach(function(key) {
    profile.reset(key);
  });
  profile.save();
  callback(null);
}