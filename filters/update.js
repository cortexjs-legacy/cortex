var 


SCM = require('../util/scm-adapter');


function Update(options){
    this.cwd = options.cwd;
    
    this.scm = new SCM(options);
};


Update.prototype = {
    run: function(callback){
        console.log('准备获取最新版本...');
        
        this.scm.pull(callback);
    }  
};


exports.create = function(options){
    return new Update(options);  
};