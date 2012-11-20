var

ORDERED_SCM_METHODS = ['git', 'svn'/* , 'tfs' */],

fs_more = require('../../util/fs-more'),
tracer = require('tracer').colorConsole(),
path = require('path');


function SCM(options){
    this.cwd = options.cwd;
    
    var type;
    
    console.log('开始分析项目源代码管理类型...');
    
    var
    
    i = 0,
    len = ORDERED_SCM_METHODS.length,
    scm_type,
    scm;
    
    for(; i < len; i ++){
        scm_type = ORDERED_SCM_METHODS[i];
        scm = require('./' + scm_type);
        
        if(scm.is(this.cwd)){
            console.log('判断出该项目为 ' + scm_type + ' 项目');
            type = scm_type;
            this.scm = new scm(options);
            break;
        }
    }
    
    if(!type){
        tracer.error('无法分析源代码管理类型，或类型不支持。目前仅支持 Git, SVN, TFS.');
        throw 'error!';
    }
};


SCM.prototype = {
    pull: function(callback){
        this.scm.pull(callback);
    }
};


module.exports = SCM;