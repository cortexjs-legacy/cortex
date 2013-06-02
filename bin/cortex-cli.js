#!/usr/bin/env node

'use strict';

var node_path = require('path');
var parser = require('../lib/util/parse-argv');

// 
var argv = process.argv;
var parsed = parser(argv);

// run command
require( node_path.join( __dirname, '..', 'lib', 'command', parsed.command ) )( parsed.options );

