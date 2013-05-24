#!/usr/bin/env node

// sub command, just like a standalone program
var program = require("commander");

if (require.main) {
    program.option("-p, --program <program>", "")
        .parse(process.argv);

    if (program.program !== undefined) console.log("-p argument:", program.program);
    
    var npmw = require('npmw');
    var npm = npmw({
        "loglevel": "silent"
    });

    npm.install(["json"], function(er, data) {
        console.log('install!!!');
        console.log(data);
        console.log(npmw.config.get("registry"));
    });
}