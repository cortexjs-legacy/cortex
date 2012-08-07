var should = require("should");
var allfile = require('../allfile');

var base = "/Users/spud/Git/cortex/res/css";

describe("allfile should be ok",function(){
	it("should return array []",function(){
		allfile(base,["css"]).should.eql(['a.css',
	  'b.css',
	  'i/c.css',
	  'i/d.css' ]);
	});
});