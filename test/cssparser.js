var fs = require('fs');
var cssparser = require('../parsers/css.js');
require('should');

var parse_dir = __dirname.split("test")[0] + "res/css/";


describe("file with relative path should return 1",function(){
	cssparser(parse_dir+"a.css","http://i1.static.dp").changed.should.eql(1);
});



describe("file without relative path should return 0",function(){
	cssparser(parse_dir+"b.css","http://i1.static.dp").changed.should.eql(0);
});


describe("should eql dest file",function(){
	var content = cssparser(parse_dir+"a.css","http://i1.static.dp").content,
			expect = fs.readFileSync(parse_dir+"b.css","utf-8");
	content.should.eql(expect);
});
