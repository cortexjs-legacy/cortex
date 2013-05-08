#! /usr/bin/env node

// sub command, just like a standalone program
var program = require("commander")
    , tracer = require("tracer").colorConsole();

if (require.main) {
    program.option("-p, --program <program>", "")
        .parse(process.argv);

    if (program.program !== undefined) console.log("-p argument:", program.program);
    var npm = require('../lib/npmw.js');

    npm.load({
        "loglevel": "silent"
    }, function(er) {
        npm.commands.install(["json"], function(er, data) {
            console.log('install!!!');
            console.log(data);
        });


        console.log(npm.config.get("registry"));
    });

}