'use strict';

var express     = require('express');
var node_path   = require('path');
var fs          = require('fs-sync');

var parser      = require('argv-parser');
var commander   = require('../commander');
var logger      = require('../logger');


// Mock the request query as the same structure as `nopt` argv object
function mock_argv (options) {
    var remain = [];
    var EMPTY = '';

    // ?=jquery&=angular    -> {'': ['jquery', 'angular']}
    // ?=jquery             -> {'': 'jquery'}
    if(EMPTY in options){
        remain = remain.concat(options[EMPTY]);
        delete options[EMPTY];
    }

    options._ = remain;

    return options;
};


module.exports = {
    route: '/_action/:action',
    callback: function (req, res, next) {
        var action = req.params.action;
        var options = mock_argv(req.query);
        var parsed;

        var option_file = node_path.resolve(__dirname, '..', '..', 'option', action + '.js');
        var action_handler = commander.get_commander(action);

        if(!action_handler){
            return res.jsonp(500, {
                error: 'Action "' + action + '" not found.'
            });
        }

        if(fs.exists(option_file)){
            var option_rules = require(option_file).options;

            parsed = parser.clean(options, {
                rules: option_rules
            });

            if(parsed.err){
                return res.jsonp(500, {
                    error: parsed.errors
                });
            
            }else{
                options = parsed.parsed;
            }
        }

        // Tell the commander that the command was called by http request
        options._http = true;
        action_handler.run(options, function (err, data) {
            if(err){
                res.jsonp(500, {

                    // we should not write `err.stack` to json response.
                    error: err.message || err
                });

                logger.error(err);

            }else{
                res.jsonp(200, {
                    message: data || 'ok'
                });

                logger.info('{{bold OK}}, {{green|bold done}}!');
            }
        });
    },

    method: 'get',

    open: function (root) {
        // require('child_process').exec('open ' + root + '/_action/build?cwd=/Users/Kael/Codes/F2EI/neurons/asset');
    }
};