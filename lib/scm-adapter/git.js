'use strict';

var

spawn = require('./spawn'),
path = require('path'),
fs_more = require('../../util/fs-more'),
tracer = require('tracer').colorConsole(),
EventProxy = require('../../util/event-proxy');


function Git(params){
    this.cwd = params.cwd;
    this.branch = params.branch;
    this.remote = params.remote;
};


Git.is = function(cwd){
    return fs_more.isDirectory( path.join(cwd, '.git/'));
};


Git.prototype = {
    
    _init: function(){
        this.pull = this._pull;
    
        this.pull(this._pull_cb);
    },
    
    pull: function(callback){
        this._pull_cb = callback;
        this._prepare();
    },

    _pull: function(callback){
    
        if(this.remote){
            spawn('git', ['pull', this.remote, this.branch], {
                cwd: this.cwd
                
            }, function(){
                callback();
            });
        }else{
            callback();
        }
    },
    
    _checkBranch: function(callback){
        var self = this;
    
        // always check branches 
        spawn('git', ['branch'], {
            cwd: this.cwd
        
        }, function(result){
            var current;
            
            result.forEach(function(branch, index){
                var split = branch[0].split(' ');
                
                if(split.length === 2 && split[0] === '*'){
                    current = result[index] = split[1];
                }
            });
            
            if(!self.branch){
                // if there's a branch address called 'master'
                if(
                    result.some(function(branch){
                        return branch === 'master';
                    })
                ){
                    console.log('由于未指定具体的分支，cortex 接下来会默认使用 master 来获取最新代码');
                    self.branch = 'master';
                
                // if there's only one branch, use it
                }else if(result.length === 1){
                    self.branch = result[0][0];
                
                }else{
                
                    // TODO:
                    // test if `throw` will cause an stderr
                    tracer.error(
                        '该项目包含多个分支 (git branch)，并且没有 master，请为项目添加 master，或者为 cortex 指定具体的分支名'
                    );
                    throw 'error!';
                    
                    return;
                }
            }
        
            if(self.branch){
                if(result.indexOf(self.branch) === -1){
                    tracer.error('该项目中不包含分支 ' + self.branch + '，请检查调用 cortex 的参数');
                    throw 'error';
                
                }else if(self.branch !== current){
                
                    console.log('切换项目分支到 ' + self.branch);
                    spawn('git', ['checkout', self.branch], {
                        cwd: self.cwd
                    
                    }, function(){
                        callback();
                    });
                
                }else{
                    callback();
                }
                
            }
        });
    },
    
    _checkRemote: function(callback){
        var self = this;
    
        if(!this.remote){
        
            spawn('git', ['remote', '-v'], {
                cwd: this.cwd
                
            }, function(result){
            
                // if there's a remote address called 'origin'
                if(result.length === 0){
                    console.log('该项目不包含 remote 地址，跳过获取代码过程');
                    
                }else if(
                    result.some(function(remote){
                        return remote[0] === 'origin';
                    })
                ){
                    console.log('由于未指定具体的 remote 地址，cortex 接下来会默认使用 remote origin 来获取最新代码');
                    self.remote = 'origin';
                
                // if there's only one remote address, use it
                }else if(result.length === 1){
                    self.remote = result[0][0];
                
                }else{
                
                    // TODO:
                    // test if `throw` will cause an stderr
                    tracer.error(
                        '该项目包含多个远程地址 (git remote -v)，并且没有 remote origin，请为项目添加 remote origin，或者为 cortex 指定 remote 地址'
                    );
                    throw 'error!';
                    return;
                }
                
                callback();
            });
        
        }else{
            callback();    
        }
    },
    
    _prepare: function(){
        var
        
        self = this,
        ep = new EventProxy(function(){
            self._init();
        });
        
        ep.assign(['remote', 'branch']);
        
        this._checkBranch(function(){
            self._checkRemote(function(){
                ep.trigger('remote');
            });
            
            ep.trigger('branch');
        });
    }
}


module.exports = Git;