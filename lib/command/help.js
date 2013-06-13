'use strict';

var fs = require('fs-sync');
var node_path = require('path');
var node_url = require('url');

var COMMAND_ROOT = __dirname;
var REGEX_REPLACE_EXTENSION = /\.js$/;

function toArray(subject){
    return Array.isArray(subject) ? subject : [subject];
};

function print(lines, options){
    lines = toArray(lines);

    options = options || {};

    lines.forEach(function(line) {
        options.prefix && process.stdout.write(options.prefix);
        process.stdout.write(line + '\n');
    });
}

function get_command_list(){
    return fs.expand('*.js', {
        cwd: COMMAND_ROOT
    
    }).map(function(command) {
        return command.replace(REGEX_REPLACE_EXTENSION, '');
    });
}

var opt_root = node_path.join(__dirname, '..', 'opt');
function get_opt(command){
    return require( node_path.join(opt_root, command) );
}

function help(){
    print([
        '',
        'Usage: ctx <command>',
        '',
        'where <command> is one of',
        '    ' + get_command_list().join(', '),
        '',
        'ctx --help            show cortex help',
        'ctx <command> -h      quick help on <command>',
        'ctx help <command>    help on <command> in detail',
        ''
    ]);
}

function quick_command_help(command){
    var opt = get_opt(command);

    print(opt.usage);
    print('View help info in detail, see: "ctx help ' + command + '"');
}

function create_spaces(amount){
    var ret = '';
    var space = ' ';

    while(amount --){
        ret += space;
    }

    return ret;
}

//
function parser_options_info(opt){
    var list = opt.list;

    var lines = Object.keys(list).map(function(name) {
        var option = list[name];
        var prefix;
        var unit;

        if(option.type === node_path){
            unit = ' <path>';
            prefix = '--' + name + unit;
        
        }else if(option.type === node_url){
            unit = ' <url>';
            prefix = '--' + name + unit;
        
        }else if(option.type === Boolean){
            prefix = '--' + name + ', --no-' + name;
        
        }else{
            unit = ' <' + name + '>';
            prefix = '--' + name + unit;
        }

        if(option.short){
            prefix += ', -' + option.short + ( unit || '' );
        }

        if(option.short_pattern){
            prefix += '(' + toArray(option.short_pattern).join(' ') + ')';
        }

        var info = option.info || '';

        // default value is a defined literal
        if( ('value' in option) && !(option.value instanceof Function) ){
            info += ' default to `' + option.value + '`';
        }

        return [prefix, info];
    
    // sort desc by length of prefix
    }).sort(function(a, b) {
        return - ( a[0].length - b[0].length );
    });

    if(lines.length){
        var max_prefix_length = lines[0][0].length;

        return lines.map(function(line) {

            // calculate table gap
            return line.join( create_spaces(4 + max_prefix_length - line[0].length) );
        });

    }else{
        return lines;
    }
}

// show help in detail
function detail_command_help(command){
    var opt = get_opt(command);
    var FOUR_SPACES = '    ';

    print('ctx ' + command + ( opt.info ? ': ' + opt.info : '') );

    print('Usage');
    print(opt.usage, {
        prefix: FOUR_SPACES
    });

    var options = parser_options_info(opt);
    if(options.length){
        print('Options:');
        print(options, {
            prefix: FOUR_SPACES
        });
    }
}

module.exports = function(options, callback) {
     var command = options.command;

     if(command === '*'){
         help();

     }else{
         options.detail ? detail_command_help(command) : quick_command_help(command);
     }

    callback && callback();
};