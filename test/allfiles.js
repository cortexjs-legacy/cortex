var should = require("should");
var allfile = require('../allfile');

var base = __dirname.split("test")[0] + "res/";


describe("allfile should be ok",function(){
	it("should return array",function(){
		allfile(base,["css"]).should.eql(['s/c/a.css',
	  's/c/b.css',
	  's/c/i/c.css',
	  's/c/i/d.css' ]);
	});
});