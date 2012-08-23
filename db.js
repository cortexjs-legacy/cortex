var mysql = require('mysql');
var config = require('./config');

var connection = mysql.createConnection({
	host: config.dbhost,
	user: config.dbuser,
	password: config.dbpassword,
	database: config.dbdatabase
});
connection.connect();

function query(){
	var args = arguments;
	var cb;


	if(args.length >= 3){
		cb = args[2];
		connection.query(args[0],arg[1],mysqlcb);
	}else{
		cb = args[1];
	}

	function mysqlcb(err,rows,fields){
		if(err){
			cb(err);
		}
		cb(null,rows,fields);
	}

	connection.query(args[0],mysqlcb);

}

function get_all_images(cb){
	var sql = "select * from " + config.DB_VERSION + " where URL REGEXP 'png$|jpg$|gif$'";
	query(sql, cb);
}

exports.query = query;
exports.connection = connection;
exports.get_all_images = get_all_images;