var db = require('../db');

db.query("select * from CM_StaticResourceVersion where URL REGEXP 'png$|jpg$|gif$'",function(rows,fields){
	console.log(rows);
});
