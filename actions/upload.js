var ActionFactory = require("./action_factory");
var db = require("../db");
var config = require("../config");
var ftpupload = require("../ftpupload");
var async = require("async");
var fs = require("fs");
var path = require("path");


var Upload = ActionFactory.create("Upload")

Upload.AVAILIABLE_OPTIONS = {
	dir:{alias:["-d","--dir"],length:1,description:"本地目录"},
	remote:{alias:["-r","--remote"],length:1,description:"远程目录"},
	host:{alias:["-h","--host"],length:1,description:"ftp主机"},
	user:{alias:["-u","--user"],length:1,description:"ftp用户名"},
	password:{alias:["-p","--pass"],length:1,description:"ftp密码"},
	port:{alias:["-P","--port"],length:1,description:"ftp端口号，默认为21"}
};


function updateDataBase(base,done){
	console.log("上传完成，开始更新数据库");
	// 更新数据库版本，下次改成更新 md5
	
	var	filelist_path = path.join(base,".cortex","filelist.json"),
		filelist;

	var tasks = [function(done){
		db.connect(function(dbconfig){
			done();
		});
	}];


	if(!fs.existsSync(filelist_path)){
		throw new Error("未包含 .cortex/filelist.json")
	}

	filelist = JSON.parse(fs.readFileSync(filelist_path));

	for(var key in filelist){
		(function(key){
			tasks.push(function(done) {
		        var qs = "select * from " + config.DB_VERSION + " where URL=\"" + key + "\"";
		        db.query(qs, function(err, rows) {
		            if(err) {
		                throw err;
		            }
		            var row = rows[0];
		            var new_version = row?(row.Version+1):1;
		            var query = row
		            	? "update " + config.DB_VERSION + " set Version=" + new_version + " where URL=\"" + key +"\""
		            	: "insert into " + config.DB_VERSION + " (URL,Version) values (\""+key+"\","+new_version+")";

	            	db.query(query,function(){
	            		console.log(key + " " + (rows[0]?"updat":"insert") + "ed to " + new_version);
	            		done();
	            	});
		        });
		    });
		})(key);
	}

	async.series(tasks,function(err){
		if(err){throw err;}else{
			console.log("update finished");
			done(null);
		}
	});
}


Upload.prototype.run = function() {
	var opts = this.options,
		mods = this.modules,
		root = mods[0];

	var upload_opt = {
		dirname:opts.dir||null,
		remotedir:opts.remote||opts.dir||null,
		username:opts.user||"",
		password:opts.password||"",
		host:opts.host,
		port:21
	};


	ftpupload.upload(upload_opt,function(){
		updateDataBase(opts.dir,function(){
			process.exit();
		});
	});
};



Upload.MESSAGE = {
	USAGE:"usage: ctx upload",
	DESCRIBE:"将本地项目目录上传并更新数据库"
}

// demo: ctx upload -h spud.in -u spudin -p ppp -d /Users/spud/Git/cortex/build/build-1351144024172 -r blah



module.exports = Upload;