'use strict';

module.exports = {
  route: '/_kill',
  middleware: function(req, res) {
    res.json({
      message: 'ok'
    });

    process.exit(1);
  },

  method: 'get'
}