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
		if(err){
			cb(err);
		}
		cb(null,rows,fields);
	});
	connection.end();
}

function get_all_images(cb){
	var sql = "select * from " + config.DB_VERSION + " where URL REGEXP 'png$|jpg$|gif$'";
	query(sql, cb);
}

exports.query = query;
exports.get_all_images = get_all_images;
