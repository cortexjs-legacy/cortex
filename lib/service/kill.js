'use strict';

module.exports = {
    route: '/_kill',
    callback: function (req, res) {
        res.json({
            message: 'ok'
        });

        process.exit(1);
    },

    method: 'get'
}