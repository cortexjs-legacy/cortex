#! /usr/bin/env node

// sub command, just like a standalone program
var program = require("commander");

if (require.main) {
    program.option("-p, --program <program>", "")
        .parse(process.argv);

    if (program.program !== undefined) console.log("-p argument:", program.program);

    var npm = require('../lib/npmw.js');

    npm.load(function(er, npm) {
        console.log(npm.config.get("registry"));
    });

}