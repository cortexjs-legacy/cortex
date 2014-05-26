'use strict';

var profile   = exports;
var asks      = require('asks');


// @param {Object} options
// - cwd: {path}
profile.run = function(options, callback) {
  options.profile = this._getProfileManager();
  var sub = options['sub-command'];

  this[sub](options, callback);
};


profile.rm = function(options, callback) {
  var name = options.name;

  if (!name) {
    return callback('You must tell cortex which profile to remove.');
  }

  var profiles = options.profile.all();
  if (!~profiles.indexOf(name)) {
    return callback('Profile "' + name + '" not found.');
  }

  var remove_data = options['remove-data'];

  // If this command is called by http server, skip conform
  if (options._http) {
    // If `options['remove-data']` is not set explicitly,
    // and this command is invoked by http server,
    // we will treated it as not to remove.
    if (remove_data === undefined) {
      options['remove-data'] = false;
    }

    return this._rm(options, callback);
  }

  var self = this;
  if (remove_data === undefined) {
    self._confirmRemoveData(name, function(result) {
      options['remove-data'] = result.removeData;

      self._rm(options, callback);
    });

  } else {
    this._rm(options, callback);
  }
};


profile._confirmRemove = function(name, callback) {
  asks.prompt([{
    type: 'confirm',
    name: 'remove',
    message: 'Are you sure you want to remove profile "' + name + '"'

  }], callback);
};


profile._confirmRemoveData = function(name, callback) {
  asks.prompt([{
    type: 'confirm',
    default: false,
    name: 'removeData',
    message: 'Do you want to remove all data of the profile "' + name + '"'

  }], callback);
};


profile._rm = function(options, callback) {
  var remove_data = options['remove-data'];
  var name = options.name;

  var p = options.profile;
  var logger = this.logger;
  p.del(name, remove_data, function(err) {
    if (err) {
      return callback(err);
    }

    if (remove_data) {
      logger.info('The profile "' + name + '" and its data have been removed.');
    } else {
      logger.info('The profile name "' + name + '" has been removed.');
    }

    callback(null);
  });
};


profile.add = function(options, callback) {
  var name = options.name;

  if (!name) {
    return callback('You must tell cortex the profile name to add.');
  }

  var p = options.profile;
  var logger = this.logger;

  p.add(name, function(err) {
    if (err) {
      return callback(err);
    }

    logger.info('Added profile "' + name + '".');
    callback(null);
  });
};


profile.use = function(options, callback) {
  var name = options.name;

  if (!name) {
    return callback('You must tell cortex which profile to use.');
  }

  var p = options.profile;
  var logger = this.logger;
  p.switchTo(name, function(err, data) {
    if (err) {
      return callback(err);
    }

    logger.info('Switched the current profile from "' + data.former + '" to "{{cyan ' + data.current + '}}"');

    callback(null);
  });
};


profile.ls = function(options, callback) {
  var p = options.profile;
  var profiles = p.all();
  var current = p.current();
  var profiles_print = profiles.map(function(name) {
    return name === current ? '* {{cyan ' + name + '}}' : '  ' + name;

  }).join('\n');

  this.logger.info(profiles_print);

  callback(null);
};


profile._getProfileManager = function() {
  return this.profile;
};