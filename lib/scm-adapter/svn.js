var

spawn = require('./spawn'),
path = require('path'),
fs_more = require('../fs-more'),
tracer = require('tracer').colorConsole(),
EventProxy = require('../event-proxy');


function SVN(params){
    this.cwd = params.cwd;
    this.branch = params.branch;
    this.remote = params.remote;
};


SVN.is = function(cwd){
    return fs_more.isDirectory( path.join(cwd, '.svn/'));
};


SVN.prototype = {
    pull: function(callback){
        spawn('svn', ['update'], {
            cwd: this.cwd
        }, function(){
            callback();
        });
    }
};