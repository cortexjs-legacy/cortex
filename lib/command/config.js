'use strict';

var config = module.exports = {};



// @param {Object} options
// - cwd: {Array.<path>}
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
    // TODO.
};

config.set = function (options, callback) {
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


