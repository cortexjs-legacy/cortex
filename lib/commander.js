'use strict';

var node_path = require('path');
var comfort = require('comfort');


var context = {
    profile: require('./profile')
};

// Commander for CLI
// cli entrance
// cache commander instance
var commander = module.exports = comfort({
    command_root: node_path.join( __dirname, 'command'),
    option_root : node_path.join( __dirname, 'option'),
    name: 'cortex',

    logger: require('./logger'),
    context: context

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

context.commander = commander;
