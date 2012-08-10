var mysql = require('mysql');
var config = require('./config');


var connection = mysql.createClient({
	host: config.dbhost,
	user: config.dbuser,
	password: config.dbpassword,
	database: config.dbdatabase
});


function query(q,cb){
	connection.query(q,function(err,rows,fields){
		if(err) throw err;
		cb(rows,fields);
	});
	connection.end();
}

function get_all_images(cb){
	query("select * from DP_StaticFileVersion where URL REGEXP 'png$|jpg$|gif$'",cb);
}

exports.query = query;
exports.get_all_images = get_all_images;
