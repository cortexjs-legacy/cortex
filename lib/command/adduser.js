'use strict';

var adduser   = module.exports = {};
var asks      = require('asks');
var lang      = require('../util/lang');

var REGEX_IS_EMAIL = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i;

var PROMPT_SCHEMAS = [{
  name: 'username',
  type: 'input',
  message: 'username',
  validate: function(username) {
    var done = this.async();

    if (username.toLowerCase() !== username) {
      return done('username must be lowercase.');
    }

    if (~encodeURIComponent(username).indexOf("%")) {
      return done('username cannot contain any non-urlsafe characters.')
    }

    done(true);
  }
}, {
  name: 'password',
  type: 'password',
  message: 'password',
  validate: function(password) {
    var done = this.async();

    if (!password) {
      return done('password is required');
    }

    done(true);
  }
}, {
  name: 'email',
  type: 'input',
  message: 'email',
  validate: function(email) {
    var done = this.async();

    if (!email) {
      return done('email is required');
    }

    if (!REGEX_IS_EMAIL.test(email)) {
      return done('invalid email.')
    }

    done(true);
  }
}];


function simple_clone(obj) {
  var ret = {};
  var key;

  for (key in obj) {
    ret[key] = obj[key];
  }

  return ret;
}


// 1. new user
// username: 
// password:

// 2. change password
// password:

// @param {Object} options
// - username: {string=}
// - password: {string=}
adduser.run = function(options, callback) {

  // If the command 'adduser' is called from the restful service, username and password must be specified
  if (options._http) {
    if (!options.username || !options.password) {
      return callback('username or password is not specified.');
    }
  }

  var schemas = [];
  var defaults = {};
  var skipped = {};

  var profile = this.profile;

  PROMPT_SCHEMAS.forEach(function(schema) {
    var key = schema.name;

    // get the existing user info from config
    var saved = profile.get(key);

    if (saved) {
      schema.default = saved;
    }

    // store the saved
    defaults[key] = saved;

    // If process.argv already contains a certain key, skip it
    if (options[key]) {
      skipped[key] = options[key];
      return;
    }

    schema = simple_clone(schema);

    schemas.push(schema);
  });

  var self = this;

  asks.prompt(schemas, function(result) {
    lang.mix(result, skipped, false);

    // if the username to add is different from the current username, `signup`
    if (
      options.signup ||
      result.username !== defaults.username ||
      result.password !== defaults.password
    ) {
      result.signup = true;
    }

    result = defaults;

    self.add(result, callback);
  });
};


// @param {Object} options
// - username
// - email
// - password
// - signup
adduser.add = function(options, callback) {
  var neuropil = this.neuropil;

  this.logger.info('{{cyan Add user}} ...');

  var self = this;
  neuropil.adduser(options, function(err, res, json) {
    if (err) {
      return callback(err, res, json);
    }

    var profile = self.profile;
    PROMPT_SCHEMAS.forEach(function(schema) {
      var key = schema.name;
      profile.set(key, options[key]);
    });

    // encrypt and hash password and username
    profile.encrypt();
    callback(err, res, json);
  });
};