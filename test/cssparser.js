var fs = require('fs');
var cssparser = require('../parsers/css.js');
var db = require("../db");

require('should');

var parse_dir = __dirname.split("test")[0] + "res/";
var host = "http://i1.static.dp";


describe("测试分析结果",function(){
	it("结果应于目标文件s/c/b.css相同",function(done){

		db.get_all_images(function(rows){
			var parser = new cssparser({base:parse_dir,host:host,image_versions:rows});
			var content = parser.parse("s/c/a.css").content,
				expect = fs.readFileSync(parse_dir+"s/c/b.css","utf-8");

			parser.parse("s/c/a.css").changed.should.eql(1);
			parser.parse("s/c/b.css").changed.should.eql(0);
			content.should.eql(expect);
			done();
		});
	});
});


var parser = new cssparser({base:parse_dir,host:host});

describe("测试方法calculatePath",function(){
	/**
	 * 1.当前css文件路径为 /s/c/a.css
	 * 2.host为 http://i1.static.dp
	 * 则
	 * 1. i/pic.png -> http://i1.static.dp/s/c/i/pic.png
	 * 2. ./i/pic.png -> http://i1.static.dp/s/i/pic.png
	 * 3. ../pic.png -> http://i1.static.dp/s/pic.png
	 */
	it("正确计算相对路径",function(){
		parser.calculatePath("s/c/a.css","i/pic.png").should.eql({host:"http://i1.static.dp",name:"/s/c/i/pic",ext:".png"});
	});
	
	it("正确计算./开头的相对路径",function(){
		parser.calculatePath("s/c/a.css","./i/pic.png").should.eql({host:"http://i1.static.dp",name:"/s/c/i/pic",ext:".png"});
	});
	
	it("正确计算../开头的相对路径",function(){
		parser.calculatePath("s/c/a.css","../pic.png").should.eql({host:"http://i1.static.dp",name:"/s/pic",ext:".png"});
	});
});



