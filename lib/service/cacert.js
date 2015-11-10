'use strict';
var fs = require('fs');
var path = require('path');

module.exports = function (opt) {
    return {
        route: '/cortex-cacert.cer',
        method: 'get',
        middleware: function (req, res) {
            fs.readFile(path.join(__dirname, '../../cert/cacert.der'), 'utf8', function (err, data) {
                if (err) res.end(err.message);
                res.set('Content-Type', 'application/x-x509-ca-cert');
                res.end(data);
            });
        }
    }
};