'use strict';

var node_path = require('path');
var base = node_path.join(__dirname, '..', '..', 'config');

module.exports = function (id) {
  id = node_path.join(base, id);
  return require(id);
};
