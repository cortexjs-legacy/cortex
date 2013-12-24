'use strict';

// ENETUNREACH


module.exports = handler;

var MESSAGE_ENUM = {
    ENETUNREACH: 'Network is unreachable. Please check your network connection.',

};

var MESSAGE_PREFIX = 'This is most likely {{bold NOT}} a problem with {{cyan cortex}} itself.';


function handler (err, callback) {
    var code = err.code;
    var message = MESSAGE_ENUM[code];

    if ( message ) {
        [
            MESSAGE_PREFIX,
            message + '\n'

        ].forEach(callback);

    } else {
        callback(err);
    }
}

