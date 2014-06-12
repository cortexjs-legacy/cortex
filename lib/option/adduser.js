'use strict';

exports.shorthands = {
  u: 'username',
  p: 'password'
};

exports.options = {
  signup: {
    info: 'Explicitly tell cortex to sign up to a new user.',
    type: Boolean
  },

  username: {
    type: String,
    enumerable: false,
    info: 'username of the registry server.',
    setter: function(v) {
      var done = this.async();

      if (!v) {
        var remain = this.get('_');
        v = remain.shift();
      }

      if (v) {
        if (v.toLowerCase() !== v) {
          return done('username must be lowercase.');
        }

        if (~encodeURIComponent(v).indexOf("%")) {
          return done('username cannot contain any non-urlsafe characters.')
        }
      }

      done(null, v);
    }
  },

  password: {
    type: String,
    enumerable: false,
    info: 'password of the registry server.',
    setter: function (v) {
      var done = this.async();
      if (!v) {
        var remain = this.get('_');
        v = remain.shift();
      }

      done(null, v);
    }
  },

  email: {
    type: String,
    info: 'email address.'
  }
};

exports.info = 'Sign up, login in or change password.';

exports.usage = [
  '{{name}} adduser [options]',
  '{{name}} adduser <username> [<password>] [options]',
  '',
  'First, it will try to add a new user. If user exists:',
  '- if you are not logged in, try to login.',
  '- if you are already logged:',
  '  - if username is not the same, try to switch account.',
  '  - if username is the same, try to modify user information.'
];
