'use strict';

var express     = require('express');
var node_path   = require('path');
var fs          = require('fs-sync');

var parser      = require('argv-parser');
var commander   = require('../commander');
var logger      = require('../logger');

module.exports = {
    route: '/_action/:action',
    callback: function (req, res, next) {
        var action = req.params.action;
        var options = req.query;
        var parsed;

        var option_file = node_path.resolve(__dirname, '..', 'option', action + '.js');
        var action_handler = commander.get_commander(action);

        if(!action_handler){
            return res.send(500, {
                error: 'Action "' + action + '" not found.'
            });
        }

        if(fs.exists(option_file)){
            var option_rules = require(option_file).options;
            parsed = parser.clean(options, {
                rules: option_rules
            });
        }

        if(parsed.err){
            return res.send(500, {
                error: parsed.errors
            });
        
        }else{
            options = parsed.parsed;
        }

        action_handler.run(options, function (err, data) {
            if(err){
                res.send(500, {

                    // we should not write `err.stack` to json response.
                    error: err.message || err
                });

                logger.error(err);

            }else{
                res.send(200, {
                    message: data || 'ok'
                });

                logger.info('{{bold OK}}, {{green|bold done}}!');
            }
        });
    },

    method: 'get',

    open: function (root) {
        require('child_process').exec('open ' + root + '/_action/build?cwd=/Users/Kael/Codes/F2EI/neurons/asset');
    }
};