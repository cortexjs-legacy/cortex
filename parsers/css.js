var fs = require('fs');


function parser(path,host){
	var content = fs.readFileSync(path,"utf-8");

	var reg = /url\(\s*(['"]?)([\w\.\/:]+)\1\s*\)/g;	
	var changed = 0;
	var matches = content.match(reg);

	function relative (path){
		return !/^http:\/\//.test(path);
	}

	matches && matches.forEach(function(match){
		var path = match.match(/\(\s*(['"]?)([\w\.\/:]+)\1\s*\)/)[2];
		if(relative(path)){
			changed = 1;
			content = content.replace(match,"url("+host+'/'+path+")");
		};
	});
	return {changed:changed,content:content};
}



module.exports=parser;
