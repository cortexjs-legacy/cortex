
var ext = "js";

function parse(dir,path,content){
	var mod = path.split(dir)[1];
	var dep;
//	var matchprovide = content.match(reg);
	
	// 
	// match 
	// require('')
	// require("")
	// unmatch
	// .require('')
	//
	var matchrequire = content.match(/[^\.]require\([\"\']([^'"]*)[\"\']\)/ig) || [];
	
	
	// 
	// match
	// D.provide('a',...)
	// D.provide("b",...)
	// D.provide(["c",'d'],...)
	//
	
	var provide = content.match(/\.provide\([\"\']([^'"]*)[\"\']\)/ig)
	
	matchrequire = matchrequire.map(function(match){
		return match.match(/[\"\']([^'"]*)[\"\']/)[1]
	});
	
	
	dep = matchrequire.map(function(mod){
		console.log(dir+mod+"."+ext);
		return {
			name:mod,
			path:dir+mod+"."+ext
		}
	});
	
	mod = mod.split("."+ext)[0];
	
	return {
		"name":mod,
		"dep":dep
	}
}


module.exports = {
	parse:parse,
	ext:ext
};
