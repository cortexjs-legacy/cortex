'use strict';

var config = module.exports = {};

var editor      = require('editor');
var node_path   = require('path');
var inquirer    = require('inquirer');

// @param {Object} options see 'lib/option/adduser.js' for details
config.run = function(options, callback) {
    options.writable = config.context.profile.writable();

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

    options.writable.forEach(function (name) {
        logger.info('   -', name); 
    });

    callback(null);
};


config.edit = function (options, callback) {
    var conf = node_path.resolve( config.context.profile.option('profile_root'), 'config.js' );

    editor(conf, function(code, signal){
        config.logger.info('{{cyan Finished}} editing with code', code);
        callback(code && 'Unknown error.');
    });
};


config.set = function (options, callback) {
    if ( options.value === undefined ) {
        if ( options._http ) {
            return callback('"value" should be specified.');
        }

        var logger = config.logger;
        var value = config.context.profile.option(options.name);
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

    if(!profile.option(name, options.value)){
        return callback('Fail to save "' + name + '".');
    }

    profile.save(name);
    callback(null);
};


config.unset = function (options, callback) {
    var profile = config.context.profile;
    var name = options.name;

    if( ! ~ options.writable.indexOf(name) ){
        return callback('Invalid option "' + name + '".');
    }

    profile.resetOption(name);
    profile.save(name);
    callback(null);
};


config['unset-all'] = function (options, callback) {
    var profile = config.context.profile;
    options.writable.forEach(function (key) {
        profile.resetOption(key);
    });
    profile.save();
    callback(null);
};


