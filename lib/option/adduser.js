'use strict';

exports.options = {
    username: {
        type: String,
        short: 'u',
        info: 'username of the registry server.',
        value: function (v, parsed, tools) {
            if ( !v ) {
                var remain = parsed.argv && parsed.argv.remain || [];
                v = remain.shift();
            }

            if ( v ) {
                if ( v.toLowerCase() !== v ) {
                    return tools.error('username must be lowercase.');
                }

                if ( ~ encodeURIComponent(v).indexOf("%") ) {
                    return tools.error('username cannot contain any non-urlsafe characters.')   
                }
            }

            return v;
        }
    },

    password: {
        type: String,
        short: 'p',
        info: 'password of the registry server.'
    },

    email: {
        type: String,
        info: 'email address.'
    }
};

exports.info = 'Sign up or change password.';

exports.usage = '{{name}} adduser [username]';