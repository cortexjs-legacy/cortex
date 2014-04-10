'use strict';

// ENETUNREACH


module.exports = handler;

var node_util = require('util');

var MESSAGE_ENUM = {
  ENETUNREACH: 'Network is unreachable. Please check your network connection.',
  ENOTFOUND: {
    condition: function(err) {
      return err.syscall === 'getaddrinfo';
    },

    message: function(err) {
      return 'Cannot resolve hostname "' + err.hostname + '". Please check your network connection.'
    }
  }
};

var MESSAGE_PREFIX = 'This is most likely {{bold NOT}} a problem with {{cyan cortex}} itself.';


function handler(err, callback) {
  var code = err.code;
  var descriptions = handler.parse_description(MESSAGE_ENUM[code]);

  if (!descriptions || !descriptions.length || !descriptions.some(function(des) {
    if (des.condition(err)) {
      [
        MESSAGE_PREFIX,
        des.message(err) + '\n'

      ].forEach(callback);

      return true;
    }
  })) {
    callback(err);
  }
}


function return_true() {
  return true;
}


handler.standardize = function(des) {
  if (typeof des === 'string') {
    des = {
      message: des
    };
  }

  des.condition = des.condition || return_true;

  var message = des.message;

  if (typeof des.message === 'string') {
    des.message = function() {
      return message;
    }
  }

  return des;
};


handler.parse_description = function(descriptions) {
  if (!descriptions) {
    return;
  }

  if (!node_util.isArray(descriptions)) {
    descriptions = [descriptions];
  }

  return descriptions.map(handler.standardize);
};