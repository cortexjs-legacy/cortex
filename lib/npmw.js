#! /usr/bin/env node


var npm = require('npm')
    , Npmw = function() {
        // init function
    };


var REGISTRY_URL = "http://registry.npm.dp/";
var CORTEX_NPM_CONFIG = {
    'registry': REGISTRY_URL
};


// wrap the npm
Npmw.prototype = npm;
Npmw.load = function(cli, cb_) {
    if (!cb_ && typeof cli === "function") cb_ = cli, cli = {};
    if (!cb_) cb_ = function() {};
    if (!cli) cli = {};

    // Overrides the default config with CORTEX_NPM_CONFIG
    for(var name in CORTEX_NPM_CONFIG) {
        var copy = CORTEX_NPM_CONFIG[name];
        var src = cli[name]

        if(src === copy) continue;
        if(copy !== undefined) cli[name] = copy;
    }

    npm.load.call(this, cli, cb_);
};

npmw = new Npmw();
module.exports = npmw;
