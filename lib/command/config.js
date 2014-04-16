'use strict';

var config    = exports;
var editor    = require('editor');
var node_path = require('path');
var inquirer  = require('inquirer');
var option    = require('../option/config');

// @param {Object} options see 'lib/option/config.js' for details
config.run = function(options, callback) {
  options.writable = this.context.profile.writable();
  options.enumerable = this.context.profile.enumerable();

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
  var conf = node_path.resolve(this.context.profile.get('profile_root'), 'config.js');
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
  var name = options.name;

  if (options.value === undefined) {
    if (options._http) {
      return callback('"value" should be specified.');
    }

    var logger = this.logger;
    var value = this.context.profile.get(name);
    var schema = {
      name: 'value',
      message: 'value',
      type: options.name === 'password' ? 'password' : 'input'
    };

    if (value) {
      schema.default = value;
    }

    var self = this;

    inquirer.prompt(schema, function(result) {
      options.value = result.value;
      self._set(options, callback);
    });

  } else {
    this._set(options, callback);
  }
};

config._set = function(options, callback) {
  var profile = this.context.profile;
  var name = options.name;

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
  var profile = this.context.profile;
  var name = options.name;

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
  var profile = this.context.profile;
  unsets.forEach(function(key) {
    profile.reset(key);
  });
  profile.save();
  callback(null);
}