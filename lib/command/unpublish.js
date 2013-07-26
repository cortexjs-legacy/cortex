'use strict';

module.exports  = unpublish;

var neuropil    = require('../neuropil');
var logger      = require('../logger');

var VERSION_ALL = '*';


// @param {Object} options
// - module: {string} module identifier
// - force: {boolean} if version === '*', `options.force` must be true
function unpublish(options, callback) {
    var module = options.module;

    var splitted = module.split('@');
    var name = splitted[0];
    var version = splitted[1] || VERSION_ALL;

    if(version === VERSION_ALL){
        if(options.force){
            logger.warn('Unpublishing the entire package "' + name + '", be sure about what you\'ve done.');

        }else{
            return callback(
                'Refusing to delete the entire package "' + name + '". Use `--force` option to do this.'
            );
        }
        
    }

    neuropil.unpublish({
        name: name,
        version: version

    }, callback);
}