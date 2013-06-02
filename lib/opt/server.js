'use strict';

exports.offset = 3;

exports.list = {
	port: {
		short: 'p',
		type: Number,
		value: 8765
	},

	open: {
		type: Boolean,
		value: true
	}
};

exports.info = 'Start cortex server';

exports.usage = 'ctx server [options]';