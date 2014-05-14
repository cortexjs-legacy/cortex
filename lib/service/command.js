'use strict';

module.exports = {
  route: '/_command/:command',
  middleware: invokeMethods,
  method: 'get'
};


var node_path = require('path');
var fs = require('fs');

var parser = require('argv-parser');
var commander = require('./config/commander');
var logger = require('./config/logger');

// Mock the request query as the same structure as `nopt` argv object
function mock_argv(options) {
  var remain = [];
  var EMPTY = '';

  // ?=jquery&=angular    -> {'': ['jquery', 'angular']}
  // ?=jquery             -> {'': 'jquery'}
  if (EMPTY in options) {
    remain = remain.concat(options[EMPTY]);
    delete options[EMPTY];
  }

  options._ = remain;

  return options;
}


function invokeMethods(req, res, next) {
  var command = req.params.command;
  var options = mock_argv(req.query);
  var parsed;

  var option_file = node_path.resolve(__dirname, '..', '..', 'option', command + '.js');
  var action_handler = commander.commander(command, function (err, action_handler) {
    if (err) {
      return res.jsonp(500, {
        error: 'Command "' + command + '" not found.'
      });
    }

    fs.exists(option_file, function(exists) {
      if (exists) {
        var option_rules = require(option_file).options;

        parsed = parser.clean(options, {
          rules: option_rules
        });

        if (parsed.err) {
          return res.jsonp(500, {
            error: parsed.errors
          });

        } else {
          options = parsed.parsed;
        }
      }

      // Tell the commander that the command was called by http request
      options._http = true;
      action_handler.run(options, function(err, data) {
        if (err) {
          res.jsonp(500, {

            // we should not write `err.stack` to json response.
            error: err.message || err
          });

          logger.error(err);

        } else {
          res.jsonp(200, {
            message: data || 'ok'
          });

          logger.info('{{bold OK}}, {{green|bold done}}!');
        }
      });
    });
  });
}