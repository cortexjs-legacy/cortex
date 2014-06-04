'use strict';

var wrapper = require('cortex-shrinkwrap');
var pkg_helper = require('../util/package');
var fs = require('fs');
var node_path = require('path');

exports.run = function (options, callback) {
  var cwd = options.cwd;
  var logger = this.logger;
  var profile = this.profile;
  pkg_helper.get_original_package(cwd, function (err, pkg) {
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

    wrapper(
      pkg, 
      profile.get('cache_root'), {
      dev: options.dev,
      async: options.async,
      enablePrerelease: options['enable-prerelease']
    }, done)
    .on('warn', function (message) {
      logger.warn(message);
    });

  });
};

