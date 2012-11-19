var

spawn = require('./spawn'),
path = require('path'),
fs_more = require('../fs-more'),
tracer = require('tracer').colorConsole(),
EventProxy = require('../event-proxy'),

REGEX_IS_SLN_FILE = /\.sln$/i;


function TFS(params){
    this.cwd = params.cwd;
    this.branch = params.branch;
    this.remote = params.remote;
};


TFS.is = function(cwd){
    var
    dir_content = fs.readdirSync(cwd);
    
    return dir_content.some(function(current){
        return REGEX_IS_SLN_FILE.test(current);
    });
};


TFS.prototype = {
    // TODO:
    // undone
    pull: function(callback){
        spawn('svn', ['update'], {
            cwd: this.cwd
            
        }, function(){
            callback();
        });
    }
};