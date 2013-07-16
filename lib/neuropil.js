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
    this.logger.info(
        'CTX', 
        this.logger.template('{{magenta method}} {{url}}', {
            url     : e.safe_url,
            method  : e.method
        }) 
    );

    e.json && this.logger.debug('json', e.json);

}).on('response', function(e){
    this.logger.info(
        'CTX',
        e.err ? '{{red ' + (e.res.statusCode || 'ERR') + '}}' : '{{green ' + (e.res.statusCode || 'OK!') + '}}',
        e.req.safe_url
    );

    this.logger.debug(
        '{{magenta ' + e.req.method + '}}',
        node_url.parse(e.req.safe_url).pathname,
        e.err,
        e.body
    );
});