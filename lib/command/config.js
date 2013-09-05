'use strict';

var config = module.exports = {};



// @param {Object} options
// - cwd: {Array.<path>}
config.run = function(options, callback) {
    if(options.list){
        return config._list(callback);
    }

    if(options.edit){
        return config._edit(callback);
    }

    config._set(options.name, options.value, callback);
};


config._list = function (options, callback) {
    
};


config._edit = function (options, callback) {
    
};

config._set = function (name, value, callback) {
    var profile = config.context.profile;

    if(!profile.option(name, value)){
        return callback('Fail to save "' + name + '".');
    }

    profile.save(name);
    callback(null);
};


