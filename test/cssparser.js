var fs = require('fs');
var cssparser = require('../parsers/css.js');
require('should');

var parse_dir = __dirname.split("test")[0] + "res/";
var host = "http://i1.static.dp";

var parser = new cssparser(parse_dir,host);


describe("file with relative path should return 1",function(){
	it("should be 1",function(){
		parser.parse("s/c/a.css").changed.should.eql(1);
	});
	
	it("should be 0",function(){
		parser.parse("s/c/b.css").changed.should.eql(0);
	});
});


describe("test Function:calculatePath",function(){
	/**
	 * 1.当前css文件路径为 /s/c/a.css
	 * 2.host为 http://i1.static.dp
	 * 则
	 * 1. i/pic.png -> http://i1.static.dp/s/c/i/pic.png
	 * 2. ./i/pic.png -> http://i1.static.dp/s/i/pic.png
	 * 3. ../pic.png -> http://i1.static.dp/s/pic.png
	 */
	it("正确计算相对路径",function(){
		parser.calculatePath("s/c/a.css","i/pic.png").should.eql("http://i1.static.dp/s/c/i/pic.png");
	});
	
	it("正确计算./开头的相对路径",function(){
		parser.calculatePath("s/c/a.css","./i/pic.png").should.eql("http://i1.static.dp/s/c/i/pic.png");
	});
	
	it("正确计算../开头的相对路径",function(){
		parser.calculatePath("s/c/a.css","../pic.png").should.eql("http://i1.static.dp/s/pic.png");
	});
	

});

describe("should eql dest file",function(){
	it("should be ok",function(){
		var content = parser.parse("s/c/a.css").content,
			expect = fs.readFileSync(parse_dir+"s/c/b.css","utf-8");
	content.should.eql(expect);
	});
});
