'use strict';

var node_path = require('path');
var commander = require('comfort');
var logger = require('./logger');

// cli entrance
// cache commander instance
module.exports = commander({
    command_root: node_path.join( __dirname, 'command'),
    option_root : node_path.join( __dirname, 'option'),
    name: 'cortex'

}).on('complete', function(e) {
    if(e.err){
        logger.error(e.err);
        logger.debug(e.data);

        return;
    }else{
        logger.info('{{green OK!}}');
        logger.end();
    }

}).on('commandNotFound', function(e) {
    logger.error(
        logger.template( '{{name}}: "{{command}}" is not a {{name}} command. See "{{name}} --help".', {
            name: e.name,
            command: e.command
        })
    );
});

