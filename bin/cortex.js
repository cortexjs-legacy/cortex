#! /usr/bin/env node
    
var logger = require("tracer").colorConsole()
, program = require("commander")
, spawn = require("child_process").spawn
, fs = require('fs')
, exists = fs.existsSync
, path = require('path')
, dirname = path.dirname
, basename = path.basename;

var ctx = module.exports = {};

// running in cli
if(require.main) {
    
    // workaround for issue 146: https://github.com/visionmedia/commander.js/issues/146
    // remove the hardcode '-h, --help' information in optionHelp()
    program.optionHelp = function(){
        var pad = function pad(str, width) {
            var len = Math.max(0, width - str.length);
            return str + Array(len + 1).join(' ');
        };
        var width = this.largestOptionLength();
        
        // Prepend the help information
        return this.options.map(function(option){
            return pad(option.flags, width)
                + '  ' + option.description;
        })
            .join('\n');
    };


    // fixed: for spawn api changes. now the error is generate with error event for nodejs > 0.10
    program.executeSubCommand = function(argv, args, unknown) {
        args = args.concat(unknown);

        if (!args.length) this.help();
        if ('help' == args[0] && 1 == args.length) this.help();

        // <cmd> --help
        if ('help' == args[0]) {
            args[0] = args[1];
            args[1] = '--help';
        }

        // executable
        var dir = dirname(argv[1]);
        var bin = basename(argv[1]) + '-' + args[0];

        // check for ./<bin> first
        var local = path.join(dir, bin);
        if (exists(local)) bin = local;

        // run it
        args = args.slice(1);
        var proc = spawn(bin, args, { stdio: 'inherit', customFds: [0, 1, 2] });

        // catch error for no file exists
        proc.on('error', function(e){
  	    if(e.code == 'ENOENT')
  		console.error("\n %s(1) does not exist\n", bin);
        });

        proc.on('exit', function(code){
            if (code == 127) {
                console.error('\n  %s(1) does not exist\n', bin);
            }
        });
    };

    
    // replace English help information with Chinesse
    program.addImplicitHelpCommand = function() {
        this.command('help [cmd]', '显示[cmd]帮助文档');
    };

    // init program sub-commands and parse arguments
    program
        .version("2.0.0")
        .option("-h, --help", "查看帮助文本")
        .on("help", program.help)
        .command("sample [sample]", "sample子命令，参考ctx-sample.js")
        .parse(process.argv);
}
