var fsmore = require('./util/fs-more'),
    FTPClient = require('ftp'),
    async = require("async"),
    fs = require('fs'),
    color = require('colors'),
    conn = new FTPClient();


function traverseUpload(dirname,remotedir,cb){
  var remotedir,cb;
  var tasks = [];

  tasks.push(function(done){
    process.stdout.write("mkdir "+remotedir+" ");
    conn.mkdir(remotedir,function(e){
      if(e){
        process.stdout.write(("fail "+e).red+"\r\n");
      }else{
        process.stdout.write("done".green+"\r\n");
      }
      done();
    })
  });

  fsmore.traverseDir(dirname,function(info){
    var task;

    if(info.isFile){
      task = function(done){
        process.stdout.write("upload "+info.fullPath+" ");
        conn.put(fs.createReadStream(info.fullPath),info.fullPath,function(e){
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
        process.stdout.write("mkdir "+info.fullPath+" ");
        conn.mkdir(info.fullPath,function(e){
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
}
 
function upload(opt,cb){
  conn.removeAllListeners('connect');
  conn.on('connect', function() {
    // authenticate as anonymous
  conn.auth(opt.username,opt.password,function(e) {
      if (e){throw e;}
      traverseUpload(opt.dirname,opt.remotedir,function(e){
        if(e){console.log(e);}
        console.log("upload finished");
        cb();
        conn.end();
      });
    });
  });
  conn.connect(opt.port||21,opt.host);
}

exports.upload = upload;