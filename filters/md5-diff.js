/**
 
 
 
 */

var

TEMP_DIR = '.cortex',

fs = require('fs'),
path = require('path');


/**
 * @param {Object} params {
    project_root: {string}
 }
 */
function Diff(params){
    this.project_root = params.project_root;
    this._prepareData(params);
};


Diff.prototype = {
    setup: function(){
        
    },
    
    /**
     * @param {function()} callback will be executed when completed
     */
    run: function(callback){
        
    },
    
    tearDown: function(){
        
    },
    
    _diff: function(list, rel_list){
        var url,
            result = {};
        
        for(url in list){
            if(list[url] !== rel_list[url]){
                result[url] = list[url];
            }
        }
        
        return result;
    },
    
    _writeList: function(list){
        var
        
        fd = fs.openSync( path.join(this.cur_build_root, TEMP_DIR );
        
        fs.writeSync(fd, JSON.stringify(list));
        
        fs.closeSync(fd);
    },
    
    _prepareData: function(params){
        var
        
        cur_build_root = params.
    }
};





module.exports = {
    
    // factory
    create: function(params){
        return new Diff(params);
    }
};