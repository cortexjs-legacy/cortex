#! /usr/bin/env node

var logger = require("tracer").colorConsole(),
	program = require("commander");

logger.info("called init", process.argv);
