var 

fs = require('fs'),

path = require('path'),

deps_parser = require('../parsers/deps'),

content = fs.readFileSync(path.join(__dirname, '../res/s/lib/a.js'));

console.log(deps_parser(content));