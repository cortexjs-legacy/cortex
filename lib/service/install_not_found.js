var commander = require('./commander');
var profile = require("./profile");
var fs = require("fs-sync");
var node_path = require("path");

var validate_format = function(path){
    return path && path.split("/").length > 3;
}

var parse_path_to_mod = function(path){
    var splited = path.split("/");
    return {
        name:splited[1],
        version:splited[2]
    }
}

var install_and_response = function(server_root, server_path){

    return function(req, res){

        var path = req.path;

        if(!validate_format(path)){
            return res.send(404,"not found");
        }

        var mod = parse_path_to_mod(path);

        commander.parse(["","","install",[mod.name,mod.version].join("@")], function(err, result, details){
            if ( err ) {
                return res.send(500,err);
            }

            // exec cortex.commands.build method
            commander.run('install', result.opt, function(err) {
                if(err){return res.send(500,err);}
                var content = fs.read( node_path.join(server_root, mod.name, mod.version, mod.name + ".js") );

                res.end(200,content);
            });
        });

    };
}


module.exports = install_and_response;