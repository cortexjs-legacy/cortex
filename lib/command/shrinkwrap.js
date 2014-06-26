'use strict';

var wrapper = require('cortex-shrinkwrap');
var cortex_json = require('read-cortex-json');
var fs = require('fs');
var node_path = require('path');

exports.run = function (options, callback) {
  var cwd = options.cwd;
  var logger = this.logger;
  var profile = this.profile;
  cortex_json.read(cwd, function (err, pkg) {
    if (err) {
      return callback(err);
    }

    function done (err, shrinkwrap) {
      if (err) {
        return callback(err);
      }

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

    wrapper(pkg, {
      cache_root: profile.get('cache_root'),
      built_root: node_path.join(options.cwd, 'neurons'),
      dev: false,
      stable_only: options['stable-only']
    }, done)
    .on('warn', function (message) {
      logger.warn(message);
    });
  });
};

