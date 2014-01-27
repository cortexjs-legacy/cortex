'use strict';

var fs          = require('fs-sync');
var node_path   = require('path');

var pkg_helper  = require('../util/package');

var AVAILABLE_ACTIONS = [
    'add',
    'rm',
    'ls'
];


var usage = '    cortex owner add <username> <pkg>\n' +
    '    cortex owner rm <username> <pkg>';

function argument_error (option, value) {
    return {
        code: 'EPARSEARG',
        message: 'Invalid arguments, usage:\n' + usage,
        data: {
            usage: usage,
            command: 'owner',
            option: option,
            value: value
        }
    };
}


exports.options = {
    action: {
        type: Boolean,
        info: 'the action to be processed, could be "add", "rm", or, "ls".',
        setter: function (action) {
            var done = this.async();

            if ( !action ) {
                action = this.get('_').shift();
            }

            if ( !~ AVAILABLE_ACTIONS.indexOf(action) ) {
                done(argument_error('action', action));
            
            } else {
                done(null, action);
            }
        }
    },

    user: {
        info: 'the user to be added or removed.',
        setter: function (user) {
            var action = this.get('action');
            var done = this.async();

            if ( action === 'ls' ) {
                return done(null);
            }

            if ( !user ) {
                user = this.get('_').shift();
            }

            if ( !user ) {
                return done(argument_error('user', user));
            }

            done(null, user);
        }
    },

    cwd: {
        type: node_path,
        info: 'current working directory.',
        default: process.cwd()
    },

    pkg: {
        type: String,
        info: 'the package name',
        setter: function (name) {
            var done = this.async();

            // 'a@0.1.0' -> 'a'
            if ( name ) {
                return done(null, name.split('@')[0]);
            }

            if ( !name ) {
                name = this.get('_').shift();
            }

            // Read local package
            // `cortex owner add kael`
            // try to read package name from package.json
            if ( !name ) {
                var cwd = pkg_helper.repo_root( this.get('cwd') );

                if ( !cwd ) {
                    return callback({
                        code: 'ENOTAREPO',
                        message: 'package.json not found',
                        data: {
                            cwd: cwd
                        }
                    });
                }

                pkg_helper.get_original_package(cwd, function (err, pkg) {
                    if ( err ) {
                        return done(err);
                    }

                    var pkg_name = pkg.name;

                    if ( !pkg_name ) {
                        return callback({
                            code: 'EINVALIDNAME',
                            message: 'invalid name of the package'
                        });
                    }

                    done(null, pkg_name);
                });

            } else {
                done(null, name);
            }
        }
    }
};

exports.info = 'Manage package owners';

exports.usage = [
    '{{name}} owner add <username> <pkg>',
    '{{name}} owner rm <username> <pkg>'
];

