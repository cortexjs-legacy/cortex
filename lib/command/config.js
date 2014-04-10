'use strict';

var config    = exports;
var editor    = require('editor');
var node_path = require('path');
var inquirer  = require('inquirer');

// @param {Object} options see 'lib/option/adduser.js' for details
config.run = function(options, callback) {
  options.writable = this.context.profile.writable();
  options.enumerable = this.context.profile.enumerable();

  var self = this;

  var special = ['list', 'edit', 'unset', 'unset-all'].some(function(option) {
    if (options[option]) {
      self[option](options, callback);
      return true;
    }
  });

  if (!special) {
    this.set(options, callback);
  }
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
    self.logger.info('{{cyan Finished}} editing with code', code);
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
      schema.
      default = value;
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
      message: '"' + name + '" is not writable.',
      data: {
        name: name
      }
    });
  }

  if (!profile.set(name, options.value)) {
    return callback('Fail to save "' + name + '".');
  }

  profile.saveConfig();

  callback(null);
};


config.unset = function(options, callback) {
  var profile = this.context.profile;
  var name = options.name;

  if (!~options.writable.indexOf(name)) {
    return callback('Invalid option "' + name + '".');
  }

  this._unset([name], callback);
};


config['unset-all'] = function(options, callback) {
  this._unset(options.writable, callback);
};


config._unset = function(unsets, callback) {
  var profile = this.context.profile;
  unsets.forEach(function(key) {
    profile.reset(key);
  });
  profile.saveConfig();
  callback(null);
}