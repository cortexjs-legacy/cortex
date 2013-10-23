"use strict";

var commander = require('../commander');
var profile = require("../profile");
var fs = require("fs-sync");
var node_path = require("path");


// {"request/0.1.0":[func,func,func]}
var installing_mods = {};

function validate_format(path) {
    return path && path.split("/").length > 3;
}

function parse_path_to_mod(path) {
    var splited = path.split("/");
    return {
        name:splited[1],
        version:splited[2]
    }
}

function add_installed_callback(path,server_root,res) {
    var identifier = get_mod_identifier_by_path(path);
    installing_mods[identifier] = installing_mods[identifier] || {};
    installing_mods[identifier][path] = installing_mods[identifier][path] || (function(res){
        return function(err){
            if(err){return res.send(500,err);}
            var file_path = node_path.join(server_root, path);
            if(fs.exists(file_path)){
                res.sendfile(file_path);
            }else{
                res.send(404,"not found");
            }
        }
    })(res);
}

function is_installing_mods(path) {
    var identifier = get_mod_identifier_by_path(path);
    return !!installing_mods[identifier];
}

function get_mod_identifier_by_path(path) {
    var mod = parse_path_to_mod(path);
    return [mod.name,mod.version].join("@");
}

function mod_folder_exists(server_root, path) {
    var mod = parse_path_to_mod(path);

    return fs.exists(node_path.join(server_root, [mod.name,mod.version].join("/")));
}


module.exports = function install_and_response(server_root) {

    return function(req, res) {

        var path = req.path;
        var identifier = get_mod_identifier_by_path(path);
        var installing = is_installing_mods(path);

        if(!validate_format(path)) {
            return res.send(404,"not found");
        }

        if(mod_folder_exists(server_root, path) 
            && 
            !fs.exists(node_path.join(server_root, path))
        ) {
            return res.send(404,"not found");   
        }

        add_installed_callback(path,server_root,res);
            
        if(!installing) {
            commander.parse(["","","install",identifier,"--no-recursive"], function(err, result, details) {
                if ( err ) {
                    return res.send(500,err);
                }

                // exec cortex.commands.build method
                commander.run('install', result.opt, function(err) {
                    for(var path in installing_mods[identifier]){
                        installing_mods[identifier][path](err);
                    }
                    delete installing_mods[identifier];
                });
            });
        }
    };
};
