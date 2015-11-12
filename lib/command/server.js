'use strict';

var server    = exports;
var fs = require('fs');
var node_path = require('path');
var util      = require('util');
var http     = require('httpolyglot');
var request   = require('request');
var express   = require('express');
var makeArray = require('make-array');
var Promise = require('promise');
var genCert = require('../util/gen-cert');

server.getCerts = function (callback) {
  var logger = this.logger;
  var cert_dir = this.profile.get('cert_root') || node_path.join(this.profile.get('profile_root'), 'certs');

  var keyPath = node_path.join(cert_dir, 'key.pem');
  var certPath = node_path.join(cert_dir, 'cert.pem');
  var certDERPath = node_path.join(cert_dir, 'cert.der');

  if (!fs.existsSync(cert_dir)) {
    fs.mkdirSync(cert_dir);
  }
  var readFile = function (path) {
    return new Promise(function (resolve, reject) {
      fs.readFile(path, function (err, res) {
        if (err) reject(err);
        else resolve(res);
      });
    })
  };
  var tryReadFile = function () {
    return Promise.all([readFile(keyPath), readFile(certPath)])
        .then(function (res) {
          callback({
            key: res[0],
            cert: res[1]
          }, {
            keyPath: keyPath,
            certPath: certPath,
            certDERPath: certDERPath
          });
        }, function (err) {
          logger.error('Cannot read cert file: ' + err.message);
          callback(null);
        });
  };
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    tryReadFile();
  } else {
    // try generate
    new Promise(function (resolve, reject) {
      genCert({
        logger: logger,
        keyPath: keyPath,
        certPath: certPath,
        certDERPath: certDERPath
      }, function (res) {
        res ? resolve() : reject();
      })
    }).then(function () {
      tryReadFile();
    }, function (err) {
      logger.error(err.message);
      callback(null);
    });
  }
};

server.run = function(options, callback) {
  options.port = options.port || this.profile.get('service_port');

  var app = express();
  var logger = this.logger;
  var self = this;
  this.getCerts(function (httpsOptions, filePaths) {
    if (!httpsOptions) {
      return callback('Certificate load failed.');
    }
    var server = http.createServer(httpsOptions, app);
    server.on('error', function(e) {
      if (e.code === 'EADDRINUSE') {
        return callback('Port "' + options.port + '" is {{red ALREADY}} in use !');
      } else {
        return callback(e);
      }
    });

    server.listen(options.port, function() {
      self.createAction(app, 'command', options);
      self.createAction(app, 'kill', options);
      self.createAction(app, 'static', options);

      logger.info('cortex server {{cyan started}} at "localhost:' + options.port + '" !');
      logger.info('Please install test root CA file at {{yellow ' + filePaths.certDERPath + '}}');
      callback(null);
    });
  });
};


// create a server
// @param {Object} options
// - port: {number}
// - method: {string}
// - callback: {Array.<function()>|function()} array of express middlewares
// - route: {string='/'} 
// - route_def: {Object=}
server.createAction = function(app, name, options) {
  var action_path = node_path.join(__dirname, '..', 'service', name);
  var config = require(action_path);

  if (typeof config === 'function') {
    config = config(options);
  }

  var method = config.method.toLowerCase();

  makeArray(config.middleware).forEach(function(callback) {
    app[method](config.route || '/', callback);
  });

  if (options.open && config.open) {
    config.open('http://localhost:' + options.port);
  }
};
