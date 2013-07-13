'use strict';

var neuropil = require('neuropil');
var profile = require('cortex-profile');

module.exports = neuropil({
    logger: require('./logger'),

}).on('request', function(e) {
    this.logger.info(
        'CTX', 
        this.logger.template('{{magenta method}} {{url}}', {
            url     : e.safe_url,
            method  : e.method
        }) 
    );

}).on('response', function(e){
    this.logger.info(
        'CTX',
        e.err ? '{{red ' + (e.res.statusCode || 'ERR') + '}}' : '{{magenta ' + (e.res.statusCode || 'OK!') + '}}',
        e.safe_url
    );
});