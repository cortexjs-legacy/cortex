"use strict";

var commander = require('../config/commander');
var profile = require("../config/profile");
var fs = require("fs");
var node_path = require("path");
var semver = require('semver');


// {"request/0.1.0":[func,func,func]}
var installing_mods = {};

var REGEX_START_TILDE = /^~/;

function validate_format(path) {
  var splitted = path.split('/').filter(Boolean);

  var name = splitted[0];
  var range = splitted[1];
  var version;

  if (REGEX_START_TILDE.test(range)) {
    // '~0.1.2' -> '0.1.2'
    version = range.replace(REGEX_START_TILDE, '');
  } else {
    version = range;
  }

  return name && (
    range === 'latest' ||
    semver.valid(version)
  );
}

function parse_path_to_mod(path) {
  var splited = path.split("/");
  return {
    name: splited[1],
    version: splited[2]
  }
}

function add_installed_callback(path, server_root, res, next) {
  var identifier = get_mod_identifier_by_path(path);
  installing_mods[identifier] = installing_mods[identifier] || {};
  installing_mods[identifier][path] = installing_mods[identifier][path] || (function(res) {
    return function(err) {
      if (err) {
        return res.send(500, err);
      }

      var file_path = node_path.join(server_root, path);
      if (fs.existsSync(file_path)) {
        res.sendfile(file_path);

      } else {
        next();
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
  return [mod.name, mod.version].join("@");
}

function mod_folder_exists(server_root, path) {
  var mod = parse_path_to_mod(path);

  return fs.existsSync(node_path.join(server_root, [mod.name, mod.version].join("/")));
}

module.exports = function(server_root) {
  return function(req, res, next) {
    var path = req.path;

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

    add_installed_callback(path, server_root, res, next);

    if (!installing) {
      commander.parse(["", "", "install", identifier, "--no-recursive"], function(err, result) {
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