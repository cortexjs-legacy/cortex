'use strict';
var path = require('path');
var Promise = require('promise');
var spawn = require('child_process').spawn;
var openssl = function (args) {
    return new Promise(function (resolve, reject) {
        var errorMessage = '';
        var child = spawn('openssl', args);
        child.on('error', function (err) {
            errorMessage = 'ERROR: ' + err.message + '\n';
        });
        child.on('close', function (code) {
            if (code) {
                reject(errorMessage + 'openssl exited with code: ' + code);
            } else {
                resolve();
            }
        })
    })
};

module.exports = function (options, callback) {
    var logger = options.logger;
    logger.info('Generating debug certificates...');
    var KEY_PATH = options.keyPath;
    var CERT_PATH = options.certPath;
    var CERT_DER_PATH = options.certDERPath;
    openssl(['list-standard-commands']).then(function () {
        return openssl(['req', '-x509', '-nodes',
            '-days', '3650',
            '-subj', '/C=CN/ST=Shanghai/L=Shanghai/O=Cortex Debug/CN=localhost',
            '-newkey', 'rsa:2048',
            '-keyout', KEY_PATH,
            '-out', CERT_PATH
        ]);
    }, function (err) {
        logger.error('Cannot find openssl. Please install openssl first.');
        return Promise.reject(err);
    }).then(function () {
        return openssl(['x509',
            '-in', CERT_PATH,
            '-outform', 'der',
            '-out', CERT_DER_PATH
        ]);
    }).then(function () {
        logger.info('Successfully generated cortex debug certs.');
        logger.info('Certificate file located at: {{cyan ' + CERT_DER_PATH + '}}');
        logger.info('{{yellow Install certificate file to allow https access to your cortex debug server.}}');
        callback(true);
    }, function (err) {
        logger.error('Generate failed: ' + err);
        callback(false);
    })
};