var mysql = require('mysql');
var config = require('./config');

var connection = mysql.createConnection({
	host: config.dbhost,
	user: config.dbuser,
	password: config.dbpassword,
	database: config.dbdatabase
});
connection.connect();

connection.on("error",function(err){
	throw new Error(err);
});

function query(){
	var args = arguments;
	var cb;

	var itv = setTimeout(function(){
		cb("数据库连接超时");
	},10*1000);

	if(args.length >= 3){
		cb = args[2];
		connection.query(args[0],arg[1],mysqlcb);
	}else{
		cb = args[1];
	}

	function mysqlcb(err,rows,fields){
		clearTimeout(itv);
		if(err){
			cb("数据库查询出错"+err);
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