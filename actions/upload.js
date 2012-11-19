"use strict";

var ActionFactory = require("./action-factory");
var db = require("../util/db");
var ftp_handler = require("../util/ftp-handler");
var ConfigHandler = require("../util/config-handler");
var fsmore = require("../util/fs-more")
var async = require("async");
var fs = require("fs");
var path = require("path");
var lang = require("../util/lang");

/**
 regular expression for ftp uri

/
    ^
    ftp:\/\/
    (?:
        # 1: user 
        ([^:]+)
        :
        # 2: password
        ([^@]+)?
        @
    )?
    # 3: ip
    (
        (?:(?:2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}
        2[0-4]\d|25[0-5]|[01]?\d\d?
    )
    (?:
        : 
        # 4: port
        ([0-9]{2,5})
    )?
    
    # 5: dir
    (\/.*)?
    
    $
/i

*/

var REGEX_MATCHER_FTP_URI = /^ftp:\/\/(?:([^:]+):([^@]+)@)?((?:(?:2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}2[0-4]\d|25[0-5]|[01]?\d\d?)(?::([0-9]{2,5}))?(\/.*)?$/i;


var 

Upload = ActionFactory.create("Upload");


Upload.AVAILIABLE_OPTIONS = {
    from: {
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
    },
    
    biz: {
        alias: ["-b", "-biz"],
        length: 1,
        description: "指定"
    }
};

var updateList = [];

function updateDataBases(base, done){

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
    
    var filelist_path = path.join(base,".cortex","filelist.json"),
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
};


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
};


lang.mix(Upload.prototype, {
    _parseArgs: function(){
        var
        o = this.options;
        
        this.conf = new ConfigHandler({
            /**
             {
                "ftpConf": {
                    "<ip>": {
                        "port": "<port>",
                        "user": "<username>",
                        "password": "<password>"
                    },
                    
                    "<ip2>": {
                    }
                },
                
                "extra": {
                    "libFolders": ["lib/1.0/", "s/j/app/", "b/js/lib/", "b/js/app/", "t/jsnew/app/"]
                }
             }
             */
            configFile: '.cortex/upload.json',
            env: o.env
            
        }).getConfig({ftpConf: {}});
        
        o.fromFTP = this._parseFTPUri(o.from);
        o.toFTP = this._parseFTPUri(o.to);
    },
    
    // merge global ftp authorization
    _mergeFTPConf: function(ftp){
        var ftp_conf = this.conf.ftpConf[ftp.host];
    
        return ftp_conf ? lang.mix(ftp, ftp_conf) : ftp;
    },
    
    // ftp://[<user>:<password>@]<ip>[:<port>][/<dir>]
    // ->
    // 
    _parseFTPUri: function(uri){
        var m = uri.match(REGEX_MATCHER_FTP_URI);
        
        return !!m ? this._mergeFTPConf({
            user: m[1],
            password: m[2],
            host: m[3],
            port: m[4],
            dir: m[5]
            
        }) : false
    },
    
    run: function(callback) {
        this._transfer(callback);
    },
    
    _transfer: function(callback){
        this._parseArgs();

        var 
        
        o = this.options,
        tasks = [],
        temp_download_dir = path.join('~', '.cortex/temp-download'),
        local_dir = o.from;
        
        if(o.fromFTP){
            local_dir = temp_download_dir;
        
            fsmore.mkdirSync(temp_download_dir)
            fsmore.emptyDirSync(temp_download_dir);
            
            tasks.push(function(done){
                ftp_handler.download({
                    localDir    : temp_download_dir,
                    remoteDir   : o.fromFTP.dir,
                    user        : o.fromFTP.user,
                    password    : o.fromFTP.password,
                    host        : o.fromFTP.host,
                    port        : o.fromFTP.port
                    
                }, function(){
                    done(); 
                });
            });
        }
        
        if(o.toFTP){
            tasks.push(function(done){
                ftp_handler.upload({
                    localDir    : local_dir,
                    remoteDir   : o.toFTP.dir,
                    user        : o.toFTP.user,
                    password    : o.toFTP.password,
                    host        : o.toFTP.host,
                    port        : o.toFTP.port
                    
                }, function(){
                    done();
                });
            });
            
        }else{
            tasks.push(function(done){
                fsmore.copyDirSync(local_dir, o.to);
            });
        }
    
        tasks.push(function(done){
            updateDataBases(local_dir, function(){
                var lock_path = path.join(opts.dir,".cortex","success.lock");
                fsmore.writeFileSync(lock_path,"");
                process.exit();
                
                done();
            });
        });
        
        async.series(tasks, callback);
    }
    
    
});


Upload.MESSAGE = {
    USAGE:"usage: ctx upload",
    DESCRIBE:"将本地项目目录上传并更新数据库"
};

// demo: ctx upload -h spud.in -u spudin -p ppp -d /Users/spud/Git/cortex/build/build-1351144024172 -r blah



module.exports = Upload;