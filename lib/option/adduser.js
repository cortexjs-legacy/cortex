'use strict';

exports.shorthands = {
  u: 'username',
  p: 'password'
};

exports.options = {
  signup: {
    info: 'sign up a new user.',
    type: Boolean
  },

  username: {
    type: String,
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
    info: 'password of the registry server.'
  },

  email: {
    type: String,
    info: 'email address.'
  }
};

exports.info = 'Sign up or change password.';

exports.usage = [
  '{{name}} adduser [--signup]',
  '{{name}} adduser '
];