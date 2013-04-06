"use strict";

var 

fsmore = require('../util/fs-more'),
path = require('path'),
FTPClient = require('ftp'),
async = require("async"),
fs = require('fs'),
lang = require('../util/lang'),
color = require('colors');



function traverseUpload(conn, localDir, remoteDir,uploadCtx,cb){
    var tasks = [], sub_dirs = [], init_remote_dir = "";

    console.log("uploading " + localDir + " -> " + remoteDir);
    
    sub_dirs = remoteDir.split("/").filter(function(dir){
        return !!dir;
        
    }).reverse();
    
    var to_upload = {};
    var success = {};

    // create dir recursively
    while(sub_dirs.length){
        (function(dir){
            tasks.push(function(done){
                process.stdout.write("mkdir " + dir + " ");
                conn.mkdir(dir, function(e){
                    if(e){
                        process.stdout.write(("创建文件夹失败，或文件夹已存在，跳过").red+"\r\n");
                    }else{
                        process.stdout.write("done".green+"\r\n");
                    }
                    done();
                });
            });
            
        })( init_remote_dir += "/" + sub_dirs.pop() );
    }

    fsmore.traverseDir(localDir,function(info){
    
        // never upload .cortex/ directory
        if(!uploadCtx && info.relPath.indexOf('.cortex') !== -1){
            return;
        }
    
        var task;
        var dest = path.join(remoteDir,info.relPath);
        if(info.isFile){
            task = function(done){
                process.stdout.write("upload "+dest+" ");
                to_upload[dest]=true;
                conn.put(fs.createReadStream(info.fullPath),dest,function(e){
                    if(e){
                        done("fatal:上传文件"+dest+"失败，请重试。".red);
                    }else{
                        success[dest]=true
                        process.stdout.write("done".green+"\r\n");
                        done();
                    }
                });
            }
        }

        if(info.isDirectory){
            task = function(done){
                process.stdout.write("mkdir "+dest+" ");
                conn.mkdir(dest,function(e){
                    if(e){
                        process.stdout.write(("创建文件夹失败，或文件夹已存在，跳过").red+"\r\n");
                    }else{
                        process.stdout.write("done".green+"\r\n");
                    }
                    done();
                });
            }
        }

        tasks.push(task);
    });

    async.series(tasks,function(e){
        if(e){
            throw e;
            return;
        }

        var unsuccess = Object.keys(to_upload).filter(function(key){
            return !success[key];
        });
        

        if(unsuccess.length){
            unsuccess.forEach(function(key){
                console.log(key,"上传失败\r\n".red);
            });
            console.log("fatal:文件上传不完整，请重新操作".red);
            process.exit(1);
            return;
        }else{
            cb();
        }
    });
};

/**
 * @param {Object} options {
        user: {string}
        password: {string}
        remoteDir: {string}
        localDir: {string}
    }
 */
function upload(options, callback){
    
    var conn = new FTPClient();
    
    conn.on('ready', function() {
    
        traverseUpload(conn, options.localDir, options.remoteDir,options.uploadCtx, function(e){
            if(e){
                console.log(e);
            }
            
            callback();
            conn.end();
        }); 
    });
    
    conn.connect(lang.mix({port:21},options));
};


function traverseDownload(conn, remoteDir, localDir, callback){
    fsmore.mkdirSync(localDir);
    
    // default to root dir
    remoteDir = remoteDir || '/';

    var tasks = [];

    conn.list(remoteDir, function(e, entries) {
        if(e){
            throw e;
        }

        var i = 0, len = entries.length,
            entry;
        
        for (; i < len; ++i) {
            entry = entries[i];
        
            if (typeof entry === 'string'){
                // console.log('<raw entry>: ' + entries[i]);
            
            } else {
                if(entry.type === '-'){
                    (function(entry){
                        tasks.push(function(done){
                            downloadFile(conn, path.join(remoteDir, entry.name), path.join(localDir, entry.name), function(e, stream, data){
                                stream.on('end', function() {
                                    done();
                                });
                            
                                stream.on('error', function(e) {
                                    conn.end();
                                    throw e;
                                });
                                
                                stream.pipe(fs.createWriteStream(data.localName));
                            });
                        });
                    })(entry);
                
                }else if(entry.type === 'd' && entry.name !== '..' && entry.name !== '.'){
                    
                    (function(entry){
                        tasks.push(function(done){
                            traverseDownload(conn, path.join(remoteDir, entry.name), path.join(localDir, entry.name), function(){
                                done();
                            }); 
                        });
                        
                    })(entry);
                }
            }
        }
        
        async.series(tasks, callback);
    });
};


function downloadFile(conn, remoteName, localName, callback){
    conn.get(remoteName, function(e, stream) {
        callback(e, stream, {
            localName: localName
        });
    });
};


/**
 * @param {Object} options {
        user: {string}
        password: {string}
        remoteDir: {string}
        localDir: {string}
    }
 */
function download(options, callback){
    var conn = new FTPClient();
    
    conn.on('ready', function(){
        traverseDownload(conn, options.remoteDir, options.localDir, function(e){
            if(e){
                console.log(e);
            }
            callback();
            conn.end();
        });
    });
    
    conn.connect(lang.mix({port:21},options));
};

exports.uploadFile = function(options,callback){

    var conn = new FTPClient();
    conn.on('ready', function(){
        var dest = options.remoteName;

        process.stdout.write("upload "+dest+" ");
        conn.put(fs.createReadStream(options.localName),dest,function(e){
            if(e){
                process.stdout.write(e.toString().red+"\r\n");
                process.exit(1);
            }else{
                process.stdout.write("done".green+"\r\n");
            }
            callback();
            conn.end();
        });
    });
    conn.connect(lang.mix({port:21},options));
};


exports.downloadFile = function(options,callback){
    var conn = new FTPClient();
    conn.on('ready', function(){
        downloadFile(conn, options.remoteName, options.localName, function(e, stream, data){
            stream.on('end', function() {
                callback();
                conn.end();
            });
            
            stream.on('error', function(e) {
                conn.end();
                console.log(e.red);
                process.exit(1);
            });
            stream.pipe(fs.createWriteStream(data.localName));
        });
    });
    conn.connect(options.port || 21, options.host);
};
exports.upload = upload;
exports.download = download;