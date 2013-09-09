'use strict';

var adduser = module.exports = {};
var asks = require('asks');

var REGEX_IS_EMAIL = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i;

var PROMPT_SCHEMA = {
    username: {
        description: 'username',
        validator: function (v, is_default, done) {
            if ( v.toLowerCase() !== v ) {
                return done('username must be lowercase.');
            }

            if ( ~ encodeURIComponent(v).indexOf("%") ) {
                return done('username cannot contain any non-urlsafe characters.')   
            }

            done(null);
        },
        required: true,
    },

    password: {
        description: 'password',
        required: true,
        hidden: true
    },

    email: {
        validator: REGEX_IS_EMAIL,
        message: 'invalid email.',
        required: true
    }
};

// 1. new user
// username: 
// password:

// 2. change password
// password:

// @param {Object} options
// - username: {string=}
// - password: {string=}
adduser.run = function (options, callback) {
    if ( options._http ) {
        if ( !options.username || !options.password ) {
            return callback('username or password is not specified.');
        }
    }

    var skip = {};

    if ( options.username ) {
        skip.username = options.username;
    }

    if ( options.password ) {
        skip.password = options.password;
    }

    if ( options.email ) {
        skip.email = options.email;
    }

    if ( Object.keys(skip).length < 3 ) {
        // adduser.logger.info('\n{{bold Please fill the field(s) below:}}');
        adduser.logger.info('');
    }

    asks({
        logger: adduser.logger,
        skip: skip

    }).get(PROMPT_SCHEMA, function (err, result) {
        adduser.add(result, callback);
    });
};


// @param {Object} options
// - username
// - email
// - password
adduser.add = function (options, callback) {
    var neuropil = adduser.context.neuropil;

    adduser.logger.info('{{cyan Add user}} ...');
    neuropil.adduser(options, callback);
};