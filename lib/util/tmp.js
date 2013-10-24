'use strict';

var node_path   = require('path');
var fs          = require('fs-sync'); 

exports.dir = function (root) {
    // Everytime it returns a different directory
    var dir = node_path.join(
        root,
        'tmp-' 
            + process.pid + '-'
            + Number( '' + Date.now() + Math.random() * 0x1000000000 ).toString(36)
    );

    if(!fs.isDir(dir)){
        fs.mkdir(dir);
    }

    temp_dirs.push(dir);

    return dir;
};


exports.clean = function () {
    temp_dirs.forEach(fs.remove);
};


var temp_dirs = [];
var _uncaughtException;

process.addListener('uncaughtException', function ( err ) {
    clean();
    _uncaughtException = true;
    
    throw err;
});


process.addListener('exit', function () {
    clean();
});


function clean () {
    // already cleaned by "uncaughtException" event
    if ( _uncaughtException ) {
        return;
    }

    exports.clean();
}

