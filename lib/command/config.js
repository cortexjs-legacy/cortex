'use strict';

var config = module.exports = {};

var editor      = require('editor');
var node_path   = require('path');
var inquirer    = require('inquirer');

// @param {Object} options see 'lib/option/adduser.js' for details
config.run = function(options, callback) {
    options.writable = config.context.profile.writable();
    options.enumerable = config.context.profile.enumerable();

    var special = ['list', 'edit', 'unset', 'unset-all'].some(function (option) {
        if(options[option]){
            config[option](options, callback);
            return true;
        }
    });

    if(!special){
        config.set(options, callback);
    }
};


config.list = function (options, callback) {
    var logger = config.logger;

    logger.info('{{bold Available options:}}');

    options.enumerable.forEach(function (name) {
        if ( ~ options.writable.indexOf(name) ) {
            logger.info('   -', name);
        }
    });

    callback(null);
};


config.edit = function (options, callback) {
    var conf = node_path.resolve( config.context.profile.get('profile_root'), 'config.js' );

    editor(conf, function(code, signal){
        config.logger.info('{{cyan Finished}} editing with code', code);
        callback(code && 'Unknown error.');
    });
};


config.set = function (options, callback) {
    var name = options.name;

    if ( options.value === undefined ) {
        if ( options._http ) {
            return callback('"value" should be specified.');
        }

        var logger = config.logger;
        var value = config.context.profile.get(name);
        var schema = {
            name: 'value',
            message: 'value',
            type: options.name === 'password' ? 'password' : 'input'
        };

        if ( value ) {
            schema.default = value;
        }

        inquirer.prompt(schema, function (result) {
            options.value = result.value;
            config._set(options, callback);
        });

    }else{
        config._set(options, callback);
    }
};

config._set = function (options, callback) {
    var profile = config.context.profile;
    var name = options.name;

    if ( ! ~ options.writable.indexOf(name) ) {
        return callback({
            code: 'ENOTWRITABLE',
            message: '"' + name + '" is not writable.',
            data: {
                name: name
            }
        });
    }

    if(!profile.get(name, options.value)){
        return callback('Fail to save "' + name + '".');
    }

    profile.saveConfig();
    
    callback(null);
};


config.unset = function (options, callback) {
    var profile = config.context.profile;
    var name = options.name;

    if( ! ~ options.writable.indexOf(name) ){
        return callback('Invalid option "' + name + '".');
    }

    config._unset([name], callback);
};


config['unset-all'] = function (options, callback) {
    config._unset(options.writable, callback);
};


config._unset = function (unsets, callback) {
    var profile = config.context.profile;
    unsets.forEach(function (key) {
        profile.resetOption(key);
    });
    profile.saveConfig();
    callback(null);
}


