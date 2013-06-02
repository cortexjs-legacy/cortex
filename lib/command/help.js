'use strict';

function print(){
	var i;

	process.stdout.write('\n');

	for( ; i < arguments.length; i ++ ){
		process.stdout.write(arguments[i] + '\n');
	}
}


function help(){
	print(
		'',
		'Usage: ctx <command>',
		'',
		'where <command> is one of',
		''
	);
}


exports.run = function() {
	help();
};

module.exports = function(options, callback) {
    







    callback && callback();
};