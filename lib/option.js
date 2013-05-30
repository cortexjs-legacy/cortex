#!/usr/bin/env node

var nopt = require('nopt');

// {
// 	cwd: {
// 		short: 'c',
// 		short_pattern: ['--cwd', '.'],

//		// default value
// 		value: process.cwd(),
//		type: node_path
// 	}
// }


module.exports = function (option_list, argv, slice){

	var known_opts = {};
	var short_hands = {};
	var default_values = {};

	Object.keys(option_list).forEach(function(key) {
		var option = option_list[key];

	    known_opts[key] = option.type;

	    console.log(key, option.short, option.value);

	    if(option.short){
	    	short_hands[option.short] = option.short_pattern || ('--' + key)
	    }

	    // options.value might be unreal
	    if('value' in option){
	    	default_values[key] = option.value;
	    }
	});

	var parsed = nopt(known_opts, short_hands, argv, slice);

	Object.keys(default_values).forEach(function(key) {
	    if( !(key in parsed) ){
	    	parsed[key] = default_values[key];
	    }
	});

	return parsed;
};