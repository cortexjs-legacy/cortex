var mysql = require('mysql');
var lion = require('./util/lion');
var url = require("url");
var config = require("./config");
var EventProxy = require("./util/event-proxy");

var connection;


exports.connect = function(cb){

	if(connection){
		cb(null,connection);
	}

	var dbconfig = {};
	var eventproxy = new EventProxy(function(){

		console.log("连接数据库");
		connection = mysql.createConnection({
			host: dbconfig.host,
			user: dbconfig.username,
			password: dbconfig.password,
			port:dbconfig.port,
			database: dbconfig.database
		});
		connection.on("error",cb);
		connection.connect();
		cb(null,connection);
	});

	var tasks = ["username","password","url"];
	console.log("正在获取数据库配置...");
	tasks.forEach(function(action){
		eventproxy.assign(action);
	});

	tasks.forEach(function(action){
		lion.get("dp-common-service.common.master.jdbc."+action,function(err,data){
			if(err){cb(err);return;}
			var parsed;
			if(action === "url"){
				parsed = url.parse(data.split("jdbc:")[1]);
				dbconfig["host"] = parsed.hostname;
				dbconfig["port"] = parsed.port;
				dbconfig["database"] = parsed.pathname.substr(1);
			}else{
				dbconfig[action] = data;
			}
			eventproxy.trigger(action);
		});
	});


}


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