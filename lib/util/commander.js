'use strict';

var nopt = require('nopt');
var lang = require('./lang');

var commander = module.exports = {};


commander.parse = function(argv, rules) {
    var parsed_rules = commander.parse_rules(rules);

    var parsed = commander.parse_argv(argv, parsed_rules);

    commander.santitize(parsed, parsed_rules.santitizers);
    commander.validate(parsed, parsed_rules.validators);

    return parsed;
};


// {
// 	cwd: {
// 		short: 'c',
//		// '-c' is equivalent to '--cwd <default-short-value>' 
// 		short_pattern: ['--cwd', '<default-short-value>'],

//		// @type {mixed|function()} default value or generator
//		// - {function()}
// 		value: process.cwd(),
//		type: node_path
// 	}
// }
commander.parse_rules = function(rules) {
    var known_opts = {};
	var short_hands = {};
	var default_values = {};
	var validators = {};

	var opts = Object.keys(rules.list);

	opts.forEach(function(key) {
		var option = rules.list[key];

	    known_opts[key] = option.type;

	    if(option.short){
	    	short_hands[option.short] = option.short_pattern || ('--' + key);
	    }

	    // options.value might be unreal
	    if('value' in option){
	    	default_values[key] = option.value;
	    }

	    if(option.validate){
	    	validators[key] = option.validate;
	    }
	});

	return {
		known: known_opts,
		short: short_hands,
		santitizers: default_values,
		offset: rules.offset,
		validators: validators,
		opts: opts
	};
};


commander.parse_argv = function(argv, rules) {
	return nopt(rules.known, rules.short, argv, rules.offset);
};


commander.santitize = function(args, santitizers) {
    lang.each(santitizers, function(key, santitizer) {
    	if(santitizer instanceof Function){
    		args[key] = santitizer(args[key], args);
    	
    	}else if( !(key in args) ){
    		args[key] = santitizer;
    	}
    });

    return args;
};


commander.validate = function(args, validators) {
    return Object.keys(validators).every(function(key) {
        var validator = validators[key];

        var parsed = validators(args[key], args);

        if(parsed){
        	return true;

        }else{
        	process.stdout.write('Illegal option "--' + key + '". See "ctx --help"');
        	process.exit(1);
        }
    });
};

