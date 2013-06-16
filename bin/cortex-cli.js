#!/usr/bin/env node

'use strict';

var node_path = require('path');
var commander = require('sub-commander');

commander({
	commands: node_path.join( __dirname, '..', 'lib', 'command'),
	options : node_path.join( __dirname, '..', 'lib', 'option'),
	name: 'ctx'
}).cli();

