'use strict';

var adduser     = module.exports = {};
var inquirer    = require('inquirer');
var lang        = require('../util/lang');

var REGEX_IS_EMAIL = /^(?:[a-z0-9!#$%&'*+\/=?^_`{|}~-]\.?){0,63}[a-z0-9!#$%&'*+\/=?^_`{|}~-]@(?:(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\])$/i;

var PROMPT_SCHEMAS = [{
        name: 'username',
        type: 'input',
        message: 'username',
        validate: function (username) {
            var done = this.async();

            if ( username.toLowerCase() !== username ) {
                return done('username must be lowercase.');
            }

            if ( ~ encodeURIComponent(username).indexOf("%") ) {
                return done('username cannot contain any non-urlsafe characters.')   
            }

            done(true);
        }
    }, {
        name: 'password',
        type: 'password',
        message: 'password',
        validate: function (password) {
            var done = this.async();

            if ( !password ) {
                return done('password is required');
            }

            done(true);
        }
    }, {
        name: 'email',
        type: 'input',
        message: 'email',
        validate: function (email) {
            var done = this.async();

            if ( !email ) {
                return done('email is required');
            }

            if ( !REGEX_IS_EMAIL.test(email) ) {
                return done('invalid email.')
            }

            done(true);
        }
    }
];


function simple_clone (obj) {
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
adduser.run = function (options, callback) {

    // If the command 'adduser' is called from the restful service, username and password must be specified
    if ( options._http ) {
        if ( !options.username || !options.password ) {
            return callback('username or password is not specified.');
        }
    }

    var schemas = [];
    var defaults = {};
    var profile = adduser.context.profile;

    PROMPT_SCHEMAS.forEach(function (schema) {
        var key = schema.name;

        // If process.argv already contains a certain key, skip it
        if ( options[key] ) {
            defaults[key] = options[key];
            return;
        }

        schema = simple_clone(schema);

        var saved = profile.option(key);

        if ( saved ) {
            schema.default = saved;
        }

        schemas.push(schema);
    });

    inquirer.prompt(schemas, function (result) {
        // if the username to add is different from the current username, `signup`
        if ( options.signup || result.username !== profile.option('username') ) {
            result.signup = true;
        }

        adduser.add(lang.mix(result, defaults), callback);
    });
};


// @param {Object} options
// - username
// - email
// - password
// - signup
adduser.add = function (options, callback) {
    var neuropil = adduser.context.neuropil;

    adduser.logger.info('{{cyan Add user}} ...');
    neuropil.adduser(options, function (err, res, json) {
        if ( err ) {
            return callback(err, res, json);
        }

        var profile = adduser.context.profile;
        PROMPT_SCHEMAS.forEach(function (schema) {
            var key = schema.name;
            profile.option(key, options[key]);
        });

        profile.saveConfig();
        callback(err, res, json);
    });
};