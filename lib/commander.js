'use strict';

var node_path = require('path');
var commander = require('comfort');


// Commander for CLI
// cli entrance
// cache commander instance
module.exports = commander({
    command_root: node_path.join( __dirname, 'command'),
    option_root : node_path.join( __dirname, 'option'),
    name: 'cortex',

    logger: require('./logger'),
    context: {
        profile: require('./profile')
    }

}).on('complete', function(e) {
    if(e.err){
        this.logger.error(e.err);
        this.logger.debug(e.data);

        return;
    }else{
        this.logger.end();
    }

}).on('commandNotFound', function(e) {
    this.logger.error(
        this.logger.template( '{{name}}: "{{command}}" is not a {{name}} command. See "{{name}} --help".', {
            name: e.name,
            command: e.command
        })
    );
});
