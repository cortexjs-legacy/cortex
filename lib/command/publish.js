'use strict';

var publish   = exports;

var node_path = require('path');
var node_url  = require('url');
var node_zlib = require('zlib');
var fs        = require('fs');

var async     = require('async');
var expand    = require('fs-expand');
var fse       = require('fs-extra');
var ignore    = require('ignore');
var fstream   = require('fstream');
var tar       = require('tar');
var semver    = require('semver');
var spawns    = require('spawns');

var lang      = require('../util/lang');
var pkg_helper = require('../util/package');

// have no fault tolerance, overload and clean your parameters ahead of time
// @param {Object} options
// - cwd: {node_path=} at least one of cwd and tar must not be undefined
// - force: {boolean=} force to publishing, default to false
// - tar: {node_path=} tar file, if not undefined, must exists
publish.run = function(options, callback) {
  var force = options.force;

  this.MESSAGE = this.locale.require('command-publish');

  var self = this;

  // prepare tgz file and package.json
  // @param {Object} opts
  // - pkg {Object} package json data
  // - tar {node_path} tar file
  this.prepare(options, function(err, data) {
    if (err) {
      return callback(err);
    }

    // @param {Object} options
    // - tar: {string} tar file path
    // - pkg: {Object} the object of package.json
    // - force: {boolean} force publishing
    self.neuropil.publish({
      tar: data.tar,
      pkg: data.pkg,
      force: options.force

    }, function(err, res, json) {

      // TODO
      // standardize callback parameters
      return callback(err);
    });
  });
};


// santitize arguments
// prepare tar file and json data
publish.prepare = function(options, callback) {
  // file = '/Users/Kael/.npm/neuronjs/2.0.1/package.tgz';
  options.temp_dir = this.profile.get('temp_dir');
  options.temp_package = node_path.join(options.temp_dir, 'package');

  var self = this;

  function finish (err) {
    if (err) {
      return callback(err);
    }

    callback(null, {
      tar: options.tar,
      pkg: options.pkg
    });
  }

  async.series([
    function (done) {
      self.read_package_json(options, done);
    },

    function (done) {
      self.run_prepublish_script(options, done);
    },

    // directory `directories.css` might not exists 
    // before the execution of `scripts.prepublish`
    function (done) {
      self.package_styles(options, done);
    },

    function (done) {
      self.pack(options, done);
    },

    function (done) {
      self.deal_prerelease_version(options, done);
    }

  ], finish);
};


publish.read_package_json = function(options, callback) {
  var self = this;

  pkg_helper.get_enhanced_package(options.cwd, function(err, data) {
    if (err) {
      if (err.code === 'EJSONPARSE') {
        return callback(self.MESSAGE.FAIL_PARSE_PKG);
      } else {
        return callback(err);
      }
    }

    options.pkg = data;
    callback(null);
  });
};


publish.run_prepublish_script = function(options, callback) {
  var pkg = options.pkg;
  var script = lang.makeArray(
    pkg.scripts && (
      pkg.scripts.prepublish ||

      // if prepublish is not defined, try to use prebuild
      pkg.scripts.prebuild
    )
  )
  // skip empty scripts
  .filter(Boolean);

  if (!script.length) {
    return callback(null);
  }

  var self = this;

  this.logger.info('{{cyan run}} "scripts.prepublish" ...');

  spawns(script, {
    cwd: options.cwd,
    stdio: 'inherit'

  }).on('spawn', function(command) {
    self.logger.info('{{cyan exec}} "' + command + '" ...');

  }).on('close', function(code, signal) {
    if (code) {
      callback({
        code: 'EBUILDSCRIPT',
        message: 'build step "scripts.prepublish" executes as a failure. exit code: ' + code,
        data: {
          code: code,
          signal: signal
        }
      });
    } else {
      callback(null);
    }

  }).on('error', function(err) {
    self.logger.warn('"scripts.prepublish" let out an error: ' + err);
  });
};


publish.package_styles = function (options, callback) {
  var pkg = options.pkg;

  // add styles field
  pkg_helper.package_styles(options.cwd, options.pkg, function(err, styles) {
    if (err) {
      return callback(err);
    }

    pkg.styles = styles;
    callback(null);
  });
};


// publish.extract_tar = function (options, callback) {
//     var file = options.tar;

//     this.logger.info( this.logger.template(this.MESSAGE.ANALYSIS_TARBALL, {
//         file: file
//     }) );

//     fstream.Reader({
//         path: file,
//         type: 'File'
//     })
//     .pipe(node_zlib.Unzip())
//     .pipe(tar.Extract({
//         path: options.temp_dir
//     }))
//     .on('end', callback);
// };

publish.pack = function(options, callback) {
  var ignore_rules = options.pkg.ignores || [];
  var temp_package = options.temp_package;
  var cwd = options.cwd;

  var file = options.tar = node_path.join(options.temp_dir, 'package.tgz');
  var self = this;

  // copy filtered files to the temp dir
  expand('**', {
    cwd: cwd,
    dot: true,

    // Adds a `/` character to directory matches 
    mark: true

  }, function(err, files) {
    if (err) {
      return callback(err);
    }

    var directories = options.pkg.directories || {};
    var include_directories = Object.keys(directories).map(function(key) {
      // Make sure the path pattern consisted with the glob result.
      var dir = node_path.join('.', directories[key]);
      var ignore_negative = '!' + dir.replace(/\/$/, '') + '/*';

      return ignore_negative;
    });

    var filter = ignore()
      // #297: by default, we will ignore 'node_modules' directory
      .addPattern([
        'node_modules'
      ])
      .addIgnoreFile(
        ignore.select([
          '.cortexignore',
          '.npmignore',
          '.gitignore'
        ])
      )
      .addPattern(ignore_rules)

      // #270: package.directories should not be ignored, even it appears in .gitignore.
      .addPattern(include_directories)
      .createFilter();

    var REGEX_ENDS_BACKSLASH = /\/$/;
    files = files
      .filter(filter)
      .filter(function (file) {
        return !REGEX_ENDS_BACKSLASH.test(file);
      });

    async.series([
      function(done) {
        self.copy(files, cwd, temp_package, done);
      },

      function(done) {
        fse.writeJSON(
          node_path.join(temp_package, 'cortex.json'),
          options.pkg,
          done
        );
      },

      function(done) {
        self.logger.info(self.logger.template(self.MESSAGE.COMPRESS_TARBALL, {
          dir: cwd,
          file: file
        }));

        self._pack(temp_package, file, done);
      }

    ], callback);
  });
};


publish.copy = function(paths, from, to, callback) {
  async.each(paths, function(path, done) {
    var src = node_path.join(from, path);

    fs.stat(src, function(err, stats) {
      if (err || !stats.isFile()) {
        // if error, skip copying
        return done(null);
      }

      var dest = node_path.join(to, path);
      fse.copy(src, dest, done);
    });
  }, callback);
};


publish._pack = function(dir, file, callback) {
  fstream.Reader({
    path: dir,
    type: 'Directory'
  })
    .pipe(tar.Pack())
    .pipe(
      node_zlib.createGzip({
        level: 6,
        memLevel: 6
      })
  )
    .pipe(fstream.Writer(file))
    .on('close', callback);
};


publish.deal_prerelease_version = function(options, callback) {
  var pkg = options.pkg;
  var sv = semver.parse(pkg.version);
  var prerelease = sv.prerelease;

  if (options.prerelease) {
    if (prerelease.length === 0) {
      prerelease.push(options.prerelease);

      pkg.version = sv.format();

    } else {
      this.logger.info(this.MESSAGE.HAS_PRERELEASE + '\n');
    }
  }

  callback(null);
};