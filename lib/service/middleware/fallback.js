'use strict';

module.exports = function(fallback) {
  return function(req, res, next) {
    if (fallback) {
      res.redirect(fallback + req.url);
    }
  };
};