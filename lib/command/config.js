'use strict';

var config = module.exports = {};



// @param {Object} options
// - cwd: {Array.<path>}
config.run = function(options, callback) {
    options.writable = config.context.profile.writable();

    if(options.list){
        return config._list(options, callback);
    }

    if(options.edit){
        return config._edit(options, callback);
    }

    if(options.unset){
        return config._unset(options, callback);
    }

    if(options['unset-all']){
        return config._unsetAll(options, callback);
    }

    config._set(options, callback);
};


config._list = function (options, callback) {
    var logger = config.logger;

    logger.info('{{bold Available options:}}');

    options.writable.forEach(function (name) {
        logger.info('   -', name);         
    });

    callback(null);
};


config._edit = function (options, callback) {
    // TODO.
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


config._unset = function (options, callback) {
    var profile = config.context.profile;
    var name = options.name;

    if( ! ~ options.writable.indexOf(name) ){
        return callback('Invalid option "' + name + '".');
    }

    profile.resetOption(name);
    profile.save(name);
    callback(null);
};


config._unsetAll = function (options, callback) {
    var profile = config.context.profile;
    options.writable.forEach(function (key) {
        profile.resetOption(key);
    });
    profile.save();
    callback(null);
};


