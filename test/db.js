var db = require('../db');

db.query("select * from DP_StaticFileVersion where URL REGEXP 'png$|jpg$|gif$'",function(rows,fields){
	console.log(rows);
});
