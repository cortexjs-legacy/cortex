'use strict';

module.exports = function (fallback) {
    return function (req, res, next) {
        console.log('fallback', req.url, fallback);

        if ( fallback ) {
            res.redirect( fallback + req.url );
        }
    };
};