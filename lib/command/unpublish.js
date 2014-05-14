'use strict';

var unpublish   = exports;
var VERSION_ALL = '*';


// @param {Object} options
// - module: {string} module identifier
// - force: {boolean} if version === '*', `options.force` must be true
unpublish.run = function(options, callback) {
  var MESSAGE = this.locale.require('command-unpublish');

  var module = options.pkg;

  var splitted = module.split('@');
  var name = splitted[0];
  var version = splitted[1] || VERSION_ALL;

  if (version === VERSION_ALL) {
    if (options.force) {
      this.logger.warn(this.logger.template(MESSAGE.WARN_UNPUBLISH_ALL, {
        name: name

      }));

    } else {
      return callback(
        this.logger.template(MESSAGE.REFUSE_UNPUBLISH_ALL, {
          name: name
        })
      );
    }
  }

  this.neuropil.unpublish({
    name: name,
    version: version

  }, callback);
}