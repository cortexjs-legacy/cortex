'use strict';

var wrapper = require('cortex-shrinkwrap');
var cortex_json = require('read-cortex-json');
var fs = require('fs');
var node_path = require('path');
var neuron = require('neuronjs');

exports.run = function (options, callback) {
  var cwd = options.cwd;
  var logger = this.logger;
  var profile = this.profile;
  var self = this;
  cortex_json.read(cwd, function (err, pkg) {
    if (err) {
      return callback(err);
    }

    function done(err, shrinkwrap) {
      if (err) {
        return callback(err);
      }

      options['with-engines'] && self.add_engines(shrinkwrap);

      var shrinkwrap_file = node_path.join(cwd, 'cortex-shrinkwrap.json');
      fs.writeFile(shrinkwrap_file, JSON.stringify(shrinkwrap, null, 2), function (err) {
        if (err) {
          return callback({
            code: 'FAIL_WRITE_SHRINKWRAP',
            message: 'Fails to write cortex-shrinkwrap.json'
          });
        }

        logger.info('{{cyan write}} to cortex-shrinkwrap.json');
        callback(null);
      });
    }

    wrapper(pkg, node_path.join(options.cwd, 'neurons'), {
      dev: false,
      async: true,
      stable_only: options['stable-only']
    }, done)
      .on('warn', function (message) {
        logger.warn(message);
      });
  });
};


exports.add_engines = function (shrinkwrap) {
  var engines = shrinkwrap.engines || (shrinkwrap.engines = {});
  var version = neuron.version();
  engines.neuron = {
    'from': 'neuron@' + version,
    'version': version
  };
};
