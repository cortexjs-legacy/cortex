"use strict";

var 

fsmore = require('../util/fs-more'),
path = require('path'),
FTPClient = require('ftp'),
async = require("async"),
fs = require('fs'),
color = require('colors'),
conn = new FTPClient();


function traverseUpload(localDir, remoteDir, cb){
    var remoteDir,cb;
    var tasks = [];

    console.log("uploading " +localDir + " -> " + remoteDir);
    tasks.push(function(done){
        process.stdout.write("mkdir "+remoteDir+" ");
        conn.mkdir(remoteDir,function(e){
            if(e){
                process.stdout.write(("fail "+e).red+"\r\n");
            }else{
                process.stdout.write("done".green+"\r\n");
            }
            done();
        });
    });

    fsmore.traverseDir(localDir,function(info){
        var task;
        var dest = path.join(remoteDir,info.relPath);
        if(info.isFile){
            task = function(done){
                process.stdout.write("upload "+dest+" ");
                conn.put(fs.createReadStream(info.fullPath),dest,function(e){
                    if(e){
                        process.stdout.write(("fail "+e).red+"\r\n");
                    }else{
                        process.stdout.write("done".green+"\r\n");
                    }
                    done();
                });
            }
        }

        if(info.isDirectory){
            task = function(done){
                process.stdout.write("mkdir "+dest+" ");
                conn.mkdir(dest,function(e){
                    if(e){
                        process.stdout.write(("fail "+e).red+"\r\n");
                    }else{
                        process.stdout.write("done".green+"\r\n");
                    }
                    done();
                });
            }
        }

        tasks.push(task);
    });

    async.series(tasks,cb);
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
    conn.removeAllListeners('connect');
    conn.on('connect', function() {
    
        conn.auth(options.user,options.password,function(e) {
            if (e){
                throw e;
            }
            
            traverseUpload(options.localDir,options.remoteDir,function(e){
                if(e){
                    console.log(e);
                }
                
                callback();
                conn.end();
            });
        });
    });
    
    conn.connect(options.port||21,options.host);
};


function traverseDownload(remoteDir, localDir, callback){
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
                            downloadFile(path.join(remoteDir, entry.name), path.join(localDir, entry.name), function(e, stream, data){
                                stream.on('success', function() {
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
                            traverseDownload(path.join(remoteDir, entry.name), path.join(localDir, entry.name), function(){
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


function downloadFile(remoteName, localName, callback){
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
    conn.removeAllListeners('connect');
    conn.on('connect', function(){

        conn.auth(options.user, options.password, function(e){
            if(e){
                throw e;
            }
            
            traverseDownload(options.remoteDir, options.localDir, function(e){
                if(e){
                    console.log(e);
                }
                callback();
                conn.end();
            });
        });
    });
    
    conn.connect(options.port || 21, options.host);
};


exports.upload = upload;
exports.download = download;