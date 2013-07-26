'use strict';

module.exports  = unpublish;

var neuropil    = require('../neuropil');
var logger      = require('../logger');
var i18n        = require('../i18n');
var MESSAGE     = i18n.require('command-unpublish');

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
            logger.warn( logger.template(MESSAGE.WARN_UNPUBLISH_ALL, {
                name: name

            }) );

        }else{
            return callback(
                logger.template(MESSAGE.REFUSE_UNPUBLISH_ALL, {
                    name: name
                })
            );
        }
    }

    neuropil.unpublish({
        name: name,
        version: version

    }, callback);
}