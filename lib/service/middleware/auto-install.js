"use strict";

var config = require('../config');
var commander = config('commander-harmony');
var profile = config('profile');
var fs = require('fs');
var node_path = require('path');
var semver = require('semver-extra');


// {"request/0.1.0":[func,func,func]}
var installing_mods = {};

function validate_format(path) {
  var splitted = path.split('/').filter(Boolean);

  var name = splitted[0];
  var range = splitted[1];

  return name && (semver.valid(range)  || semver.validRange(range));
}

function parse_path_to_mod(path) {
  var splited = path.split("/");
  return {
    name: splited[1],
    version: splited[2]
  }
}

function add_installed_callback(path, server_root, res, next, prerelease) {
  var identifier = get_mod_identifier_by_path(path);
  installing_mods[identifier] = installing_mods[identifier] || {};
  installing_mods[identifier][path] = installing_mods[identifier][path] || (function(res) {
    return function(err) {
      if (err) {
        return res.send(500, err);
      }
      
      var mod = parse_path_to_mod(path);
      var mod_path = node_path.join(server_root, mod.name);
      fs.exists(mod_path, function(exists) {
        if (!exists) {
          return next();
        }
        
        var range = mod.version;
        fs.readdir(mod_path, function(err, files) {
          if (err) return next();
          
          if (prerelease) {
            files = files.filter(function(ver) {
              var p = semver.parse(ver);
              return p.prerelease.length == 0 || (p.prerelease.length == 1 && p.prerelease[0] == prerelease);
            });
          }
          
          // files are read from global built_root, range may not be resolved to the same version as local development
          var version = semver.maxSatisfying(files, range);

          var ps = path.split('/');
          ps.splice(2, 1, version);

          var file_path = node_path.join(server_root, ps.join('/'));
          if (fs.existsSync(file_path)) {
            res.sendfile(file_path);

          } else {
            next();
          }
        });
      });
    }
  })(res);
}

function is_installing_mods(path) {
  var identifier = get_mod_identifier_by_path(path);
  return !!installing_mods[identifier];
}

function get_mod_identifier_by_path(path) {
  var mod = parse_path_to_mod(path);
  return [mod.name, mod.version].join("@");
}

function mod_folder_exists(server_root, path) {
  var mod = parse_path_to_mod(path);

  return fs.existsSync(node_path.join(server_root, [mod.name, mod.version].join("/")));
}

function is_version_stable(version) {
  var p = semver.parse(version);
  return !p.prerelease.length;
}

module.exports = function(server_root, prerelease) {
  return function(req, res, next) {
    var path = decodeURIComponent(req.path);

    var identifier = get_mod_identifier_by_path(path);
    var installing = is_installing_mods(path);
    

    if (!validate_format(path)) {
      return next();
    }


    var file = node_path.join(server_root, path);

    if (fs.existsSync(file)) {
      return res.sendfile(file);
    }

    if (mod_folder_exists(server_root, path) && !fs.existsSync(file)) {
      return res.send(404, "not found");
    }

    add_installed_callback(path, server_root, res, next, prerelease);

    if (!installing) {
      var args = [
        "", "", "install", identifier, 
        "--no-recursive",
        '--global'
      ];
      
      if (prerelease) {
        args.push("--prerelease", prerelease);
      }

      commander.parse(args, function(err, result) {
        if (err) {
          return res.send(500, err);
        }

        // exec cortex.commands.build method
        commander.command('install', result.options, function(err) {
          for (var path in installing_mods[identifier]) {
            installing_mods[identifier][path](err);
          }
          delete installing_mods[identifier];
        });
      });
    }
  };
};
