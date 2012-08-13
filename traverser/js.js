var 

Processor = require('../parsers/js-processor'),
deps = require('../parsers/js-deps'),
spawn = require('child_process').spawn,
path = require('path');



var parser = new Processor;

traverse({
    iterator: function(path, data){
        parser.parse(path);
    }
);