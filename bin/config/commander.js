'use strict';

var node_path = require('path');
var comfort   = require('comfort');
var logger    = require('./logger');
var handler   = require('cortex-command-errors');

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
.on('error', handler(logger, profile));

context.commander = commander;
