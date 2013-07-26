'use strict';

var neuropil = require('neuropil');
var profile = require('cortex-profile');
var node_url = require('url');

module.exports = neuropil({
    logger: require('./logger'),

    username: 'kael2',
    password: 'blah-blah-bie',
    email: 'i@kael.me',

    port: profile.option('registry_port'),
    host: profile.option('registry')

}).on('request', function(e) {
    this.logger.info.ln(
        '  ', 
        this.logger.template('{{magenta method}} {{url}}', {
            url     : e.safe_url,
            method  : e.method
        }) 
    );

    e.json && this.logger.debug('\njson', e.json);

}).on('response', function(e){
    var code = e.res.statusCode;

    this.logger.info(
        '',
        e.err ? 
            '{{red ' + (code || 'ERR') + '}}' : 
            '{{' + ( is_code_success(code) ? 'green' : 'yellow' ) + ' ' + (e.res.statusCode || 'OK!') + '}}'
    );

    this.logger.debug(
        '\n{{magenta ' + e.req.method + '}}',
        node_url.parse(e.req.safe_url).pathname,
        e.err,
        e.body
    );
});


function is_code_success(code){
    return !!code && code >= 200 && code < 300;
}