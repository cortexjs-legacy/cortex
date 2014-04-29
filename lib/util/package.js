// utility tools for package.json

'use strict';

var fse         = require('fs-extra');
var expand      = require('fs-expand');
var fs          = require('fs');
var node_path   = require('path');
var readPkgJSON = require('read-package-json');
var lang        = require('./lang');
var async       = require('async');

var REGEX_IS_CORTEX = /cortex\.json$/i;


exports.is_cortex_json = function(file) {
  return REGEX_IS_CORTEX.test(file);
};


// Sync method
// @param {path} cwd
// @param {function(err, package_file)} callback
// @param {boolean} strict If true and package is not found, an error will be thrown.
exports.get_package_file = function(cwd, callback, strict) {
  var cortex_json = node_path.join(cwd, 'cortex.json');
  fs.exists(cortex_json, function (exists) {
    if (exists) {
      return callback(null, cortex_json);
    }

    var package_json = node_path.join(cwd, 'package.json');
    fs.exists(package_json, function (exists) {
      if (exists) {
        return callback(null, package_json);
      }

      if (strict) {
        return callback({
          code: 'ENOPKG',
          message: 'Both cortex.json and package.json are not found.',
          data: {
            cwd: cwd
          }
        });
      }

      // default to `cortex_json`
      callback(null, cortex_json);
    });
  });
};



// Get the enhanced and cooked json object of package, including
// - readme
// - readmeFilename
// - gitHead
// This method is often used for publishing
// @param {string} cwd The ROOT directory of the current package 
exports.get_enhanced_package = function(cwd, callback) {
  var file;

  async.waterfall([
    function(done) {
      exports.get_package_file(cwd, done, true);
    },

    function(f, done) {
      file = f;
      exports.enhance_package_file(f, done);
    },

    function(json, done) {
      // if read from package.json, there is a field named `cortex`
      if (!exports.is_cortex_json(file)) {
        json = exports.merge_package_json(json);
      }

      var name = json.name;
      if (name.toLowerCase() !== name) {
        return done({
          code: 'EUPPERNAME',
          message: 'package.name should not contain uppercased letters.',
          data: {
            name: name
          }
        });
      }

      done(null, json);
    }

  ], callback);
};


// Get the original json object about cortex, or the cortex field of package.json.
// This method is often used for altering package.json file
exports.get_original_package = function(cwd, callback, use_inherits) {
  var file;

  async.waterfall([

    function(done) {
      exports.get_package_file(cwd, done, true);
    },

    function(f, done) {
      file = f;
      exports.read_json(f, done);
    },

    function(json, done) {
      if (!exports.is_cortex_json(file)) {
        json = exports.merge_package_json(json, use_inherits);
      }

      done(null, json);
    }

  ], callback);
};


exports._filter_package_fields = function(json) {
  ['dependencies', 'asyncDependencies', 'devDependencies', 'scripts'].forEach(function(key) {
    if (!json.hasOwnProperty(key)) {
      json[key] = {};
    }
  });
};


exports.save_package = function(cwd, json, callback) {
  exports.get_package_file(cwd, function(err, file) {
    if (err) {
      return callback(err);
    }

    if (exports.is_cortex_json(file)) {
      exports.save_to_file(file, json, callback);

    } else {
      exports.read_json(file, function(err, pkg) {
        if (err) {
          return callback(err);
        }

        pkg.cortex = json;

        exports.save_to_file(file, pkg, callback);
      });
    }
  });
};


exports.save_to_file = function(file, json, callback) {
  fs.writeFile(file, JSON.stringify(json, null, 2), function(err) {
    callback(err && {
      code: 'ESAVEPKG',
      message: 'fail to save package to "' + file + '", error: ' + err.stack,
      data: {
        error: err,
        file: file
      }
    });
  });
};


exports.read_json = function(file, callback) {
  fse.readJson(file, function (err, pkg) {
    if (err) {
      return callback({
        code: 'EREADPKG',
        message: 'Error reading "' + file + '": \n' + e.stack,
        data: {
          error: e
        }
      });
    }

    callback(null, pkg);
  });
};


exports.enhance_package_file = function(file, callback) {
  readPkgJSON(file, callback);
};


// Merge the fields of package.json into the field cortex
// @param {boolean} use_inherits 
exports.merge_package_json = function(pkg, use_inherits) {
  var cortex;

  if (use_inherits) {
    var F = function() {};
    F.prototype = pkg;

    var cortex = new F;
    lang.mix(cortex, pkg.cortex || {});
    delete pkg.cortex;

    exports._filter_package_fields(cortex);

  } else {
    cortex = pkg.cortex || {};
    exports._filter_package_fields(cortex);

    lang.mix(cortex, pkg, false);
    delete cortex.cortex;
  }

  return cortex;
};


exports.package_styles = function(cwd, pkg, callback) {
  var directories_css = lang.object_member_by_namespaces(pkg, 'directories.css');

  if (!directories_css) {
    return callback(null, []);
  }

  if (directories_css.indexOf('../') === 0 || directories_css.indexOf('/') === 0) {
    return callback({
      code: 'EINVALIDDIRCSS',
      message: '`directories.css` should not start with "../" or "/".',
      data: {
        css: directories_css
      }
    });
  }

  // './css' -> 'css'
  if (directories_css.indexOf('./') === 0) {
    directories_css = directories_css.slice(2);
  }

  var dir = node_path.join(cwd, directories_css);
  fs.stat(dir, function (err, stats) {
    if (err || !stats.isDirectory()) {
      // #310
      return callback({
        code: 'ENOTENTCSS',
        message: '`directories.css` defined but not found or can not access.',
        data: {
          css: directories_css
        }
      });
    }

    expand('**/*.css', {
      cwd: dir
    }, function (err, files) {
      if (err) {
        return callback(null, []);
      }

      // fixes #263
      // 'a.css' -> 'css/a.css'
      files = files.map(function (p) {
        return node_path.join(directories_css, p);
      });

      callback(null, files);
    })
  });
};


// Get the root path of the project
exports.repo_root = function(cwd, callback) {
  if (cwd === '/') {
    return callback(null);
  }

  fs.exists(node_path.join(cwd, 'cortex.json'), function (exists) {
    if (exists) {
      return callback(cwd);
    }

    fs.exists(node_path.join(cwd, 'package.json'), function (exists) {
      if (exists) {
        return callback(cwd);
      }

      cwd = node_path.dirname(cwd);
      return exports.repo_root(cwd, callback);
    });
  });
};


// Get the cached document of a specific package,
// which will be saved by the last `cortex install` or `cortex publish`
// @param {Object} options
// - name
// - cache_root
// @param {fuction(err, json)} callback
exports.get_cached_document = function(options, callback) {
  var document_file = node_path.join(options.cache_root, options.name, 'document.cache');

  fs.exists(document_file, function (exists) {
    if (!exists) {
      return callback(null, {});
    }

    fs.readFile(document_file, function (err, content) {
      // fail silently
      if (err) {
        return callback(null, {});
      }

      var json;
      try {
        json = modified.parse(content);
      } catch (e) {
        // Legacy with modified < 2.0.0.
        // The data structure of document.cache is changed, so remove old caches
        fse.remove(document_file, function(){});
      }

      callback(null, json || {});
    });
  });
};