"use strict";

var ActionFactory = require("./action-factory");
var db = require("../util/db");
var ftpupload = require("../util/ftp-handler");
var fsmore = require("../util/fs-more")
var async = require("async");
var fs = require("fs");
var path = require("path");

/**
 regular expression for ftp uri

/
    ftp:\/\/
    (?:
        # user
        ([^:]+)
        :
        # password
        ([^@]+)
        @
    )?
    # ip
    (
        (?:(?:2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}
        2[0-4]\d|25[0-5]|[01]?\d\d?
    )
    (?:
        : 
        # port
        ([0-9]{2,5})
    )?    
/i

*/

var REGEX_MATCHER_FTP_URI = /ftp:\/\/(?:([^:]+):([^@]+)@)?((?:(?:2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}2[0-4]\d|25[0-5]|[01]?\d\d?)(?::([0-9]{2,5}))?/i;


var Upload = ActionFactory.create("Upload")

Upload.AVAILIABLE_OPTIONS = {
    dir: {
        alias: ["-d", "--dir"],
        length: 1,
        description: "需要上传的文件目录。若为远程目录，则格式为 ftp://[<user>:<password>@]<ip>[:<port>][/<dir>]; 若为本地目录，则可使用本地目录的路径"
    },
    
    to: {
        alias: ["-t", "--to"],
        length: 1,
        description: "文件包需要上传到的远程目录。格式为 ftp://[<user>:<password>@]<ip>[:<port>][/<dir>]; 也可指定为本地目录。"
    },
    
    env: {
        alias: ["-e", "--env"],
        length: 1,
        description: "指定发布的环境（可选）。对一个名为 <config>.json 的配置文件，cortex 会尝试读取 <config>.<env>.json 的文件。对于点评来说，可选的参数有 'alpha', 'qa'(beta), 'pro'(product)。"
    }
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

function updateDataBaseOld(base, done){

    // 更新数据库版本，下次改成更新 md5
    
    var    filelist_path = path.join(base,".cortex","filelist.json"),
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
        mods = this.modules;
        


    var upload_opt = {
        localDir:opts.dir||null,
        remoteDir:opts.remote||opts.dir||null,
        username:opts.user||"",
        password:opts.password||"",
        host:opts.host,
        port:21
    };


    ftpupload.upload(upload_opt,function(){
        updateDataBases(opts.dir,function(){
            var lock_path = path.join(opts.dir,".cortex","success.lock");
            fsmore.writeFileSync(lock_path,"");
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