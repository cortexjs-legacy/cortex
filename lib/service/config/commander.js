'use strict';

var node_path = require('path');
var comfort   = require('comfort');


var context   = {
  profile: require('./profile'),
  neuropil: require('./neuropil'),
  locale: require('./i18n'),
  logger: require('./logger')
};

// Commander for CLI
// cli entrance
// cache commander instance
var commander = module.exports = comfort({
  command_root: node_path.join(__dirname, '..', '..', 'command'),
  option_root: node_path.join(__dirname, '..', '..', 'option'),
  root: root,
  prevent_extensions: true,
  name: 'cortex',

  logger: require('./logger'),
  context: context

}).on('complete', function(e) {
  var err = e.error;

  if (err) {
    if (err instanceof Error) {
      // loggie will deal with `Error` instances
      this.logger.error(err);

      // error code
    } else if (typeof err === 'number') {
      this.logger.error('Not ok, exit code: ' + err);

    } else {
      this.logger.error(err.message || err);
    }
  }
});

context.commander = commander;