"use strict";

var ActionFactory = require("./action_factory");
var db = require("../db");
var config = require("../config");
var ftpupload = require("../ftpupload");
var fsmore = require("../util/fs-more")
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

var updateList = [];



function updateDataBases(base,done){

	console.log("上传完成，开始更新数据库");
	var tasks = [];


	tasks.push(function(done){
		updateDataBaseOld(base,done);
	});
 
	tasks.push(function(done){
		updateDataBaseNew(base,done);
	});
 
	async.series(tasks,function(err){
		done();
	});
}

function updateDataBaseOld(base,done){

	// 更新数据库版本，下次改成更新 md5
	
	var	filelist_path = path.join(base,".cortex","filelist.json"),
		table = config.DB_VERSION,
		filelist,
		tasks;

	function fileTypeByPath(p){
		return ['lib/1.0/','s/j/app/','b/js/lib/','b/js/app/','t/jsnew/app/'].some(function(prefix){
			return p.indexOf(prefix) == 1 && path.extname(p) == ".js";
		}) ? 1 : 0;
	}

	if(!fs.existsSync(filelist_path)){
		throw new Error("未包含 .cortex/filelist.json");
	}

	filelist = JSON.parse(fs.readFileSync(filelist_path));

	tasks = [function(done){
		db.connect("old",function(err,conn,dbconfig){
			console.log("已连接数据库",dbconfig);
			done();
		});
	}];

	var count = 0;

	for(var key in filelist){
		(function(key){
			tasks.push(function(done) {

		        var where = {URL:key},
		        	qs = db.sqlMaker("select",table,{},where);

		        db.query(qs, function(err, rows) {
		            if(err) throw err;
		            var row = rows[0],
		            	new_version = row?(row.Version+1):1,
		            	pair = {URL:key,Version:new_version,FileType:fileTypeByPath(key)},
		            	query = row
			            	? db.sqlMaker("update",table,pair,where)
			            	: db.sqlMaker("insert",table,pair);

	            	db.query(query,function(err){
	            		if(err)throw err;
	            		console.log((row?"更新":"插入") + " " + JSON.stringify(pair));
		           		updateList.push(pair);
	            		done();
	            	});
		        });
		    });
		})(key);
	}

	async.series(tasks,function(err){
		if(err){throw err;}else{
			console.log("更新完成");
			done(null);
		}
	});
}

function updateDataBaseNew(base,done){
	console.log("同步数据库");
	var table = config.DB_VERSION;
	var tasks = [function(done){
		db.connect("new",function(err,conn,dbconfig){
			console.log("已连接数据库",dbconfig);
			done();
		});
	}];

	updateList.forEach(function(pair){
		var key = pair.URL;
		tasks.push(function(done){
			var qs = db.sqlMaker("select",table,{},{URL:key});
	        
	        db.query(qs, function(err, rows) {
	            if(err) throw err;
	            var row = rows[0],
	            	query = row
		            	? db.sqlMaker("update",table,pair,{
		            		URL:key
		            	})
		            	: db.sqlMaker("insert",table,pair);

            	db.query(query,function(err){
		            if(err) throw err;
            		console.log((row?"更新":"插入") + " " + JSON.stringify(pair));
            		done();
            	});
	        });
		});
	});

	async.series(tasks,function(err){
		if(err){throw err;}else{
			console.log("更新完成");
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


	// ftpupload.upload(upload_opt,function(){
		updateDataBases(opts.dir,function(){
			var lock_path = path.join(opts.dir,".cortex","success.lock");
			fsmore.writeFileSync(lock_path,"");
			process.exit();
		});
	// });
};



Upload.MESSAGE = {
	USAGE:"usage: ctx upload",
	DESCRIBE:"将本地项目目录上传并更新数据库"
}

// demo: ctx upload -h spud.in -u spudin -p ppp -d /Users/spud/Git/cortex/build/build-1351144024172 -r blah



module.exports = Upload;