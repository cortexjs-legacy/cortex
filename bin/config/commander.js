'use strict';

var node_path = require('path');
var comfort   = require('comfort');
var logger    = require('./logger');

var context = {
  profile: require('./profile'),
  neuropil: require('./neuropil'),
  locale: require('./i18n'),
  logger: logger
};

var root = node_path.join(__dirname, '..', '..');

// Commander for CLI
// cli entrance
// cache commander instance
var commander = module.exports = comfort({
  command_root: node_path.join(root, 'lib', 'command'),
  option_root: node_path.join(root, 'lib', 'option'),
  root: root,
  name: 'cortex',
  context: context
})
.on('error', function(err) {
  if (err instanceof Error) {
    // loggie will deal with `Error` instances
    logger.fatal(err);

    // error code
  } else if (typeof err === 'number') {
    logger.fatal(err, 'Not ok, exit code: ' + err);

  } else {
    logger.fatal(err.exitcode, err.message || err);
  }
})
.on('entry', function () {
  
});

context.commander = commander;
