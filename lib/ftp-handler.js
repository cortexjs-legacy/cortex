"use strict";

var 

fsmore = require('../util/fs-more'),
path = require('path'),
FTPClient = require('ftp'),
async = require("async"),
fs = require('fs'),
color = require('colors');


function traverseUpload(conn, localDir, remoteDir, cb){
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
    
        // never upload .cortex/ directory
        if(info.relPath.indexOf('.cortex') !== -1){
            return;
        }
    
        var task;
        var dest = path.join(remoteDir,info.relPath);
        if(info.isFile){
            task = function(done){
                process.stdout.write("upload "+dest+" ");
                conn.put(fs.createReadStream(info.fullPath),dest,function(e){
                    if(e){
                        process.stdout.write(("fail "+ e).red+"\r\n");
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
                        process.stdout.write(("fail "+ e).red+"\r\n");
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
    
    var conn = new FTPClient();
    
    conn.on('connect', function() {
    
        conn.auth(options.user, options.password, function(e) {
            if (e){
                throw e;
            }
            
            traverseUpload(conn, options.localDir, options.remoteDir, function(e){
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
    
    conn.on('connect', function(){

        conn.auth(options.user, options.password, function(e){
            if(e){
                throw e;
            }
            
            traverseDownload(conn, options.remoteDir, options.localDir, function(e){
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

exports.uploadFile = function(options,callback){

    var conn = new FTPClient();
    conn.on('connect', function(){
        var dest = options.remoteName;

            process.stdout.write("upload "+dest+" ");
            conn.put(fs.createReadStream(option.localName),dest,function(e){
                if(e){
                    process.stdout.write(("fail "+e).red+"\r\n");
                }else{
                    process.stdout.write("done".green+"\r\n");
                }
                callback();
                conn.end();
            });
    })
    conn.connect(options.port || 21, options.host);
};


exports.downloadFile = function(options,callback){
    var conn = new FTPClient();
    conn.on('connect', function(){
        conn.auth(options.user, options.password, function(e){
            if(e){
                throw e;
            }
            downloadFile(conn, options.remoteName, options.localName, function(e, stream, data){
                stream.on('success', function() {
                    callback();
                    conn.end();
                });
                stream.on('error', function(e) {
                    conn.end();
                    throw e;
                });
                stream.pipe(fs.createWriteStream(data.localName));
            });
        });
    });
    conn.connect(options.port || 21, options.host);
};
exports.upload = upload;
exports.download = download;