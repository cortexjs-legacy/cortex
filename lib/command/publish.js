'use strict';

var publish   = exports;

var node_path = require('path');
var node_url  = require('url');
var node_zlib = require('zlib');
var fs        = require('fs');
var util      = require('util');

var async     = require('async');
var fse       = require('fs-extra');
var fstream   = require('fstream');
var tar       = require('tar');
var semver    = require('semver-extra');
var semver_helper = require('../util/semver');
var run_scripts   = require('../util/run-scripts');

var makeArray   = require('make-array');
var cortex_json = require('read-cortex-json');
var pf          = require('cortex-package-files');

// have no fault tolerance, overload and clean your parameters ahead of time
// @param {Object} options
// - cwd: {node_path=} at least one of cwd and tar must not be undefined
// - force: {boolean=} force to publishing, default to false
// - tar: {node_path=} tar file, if not undefined, must exists
publish.run = function(options, callback) {
  this.MESSAGE = this.locale.require('command-publish');

  var force = options.force;
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
      self.read_cortex_json(options, done);
    },
    function (done) {
      self.run_prepublish_script(options, done);
    },
    function (done) {
      self.pack(options, done);
    }
  ], finish);
};


publish.read_cortex_json = function (options, callback) {
  var self = this;
  cortex_json.enhanced(options.cwd, function(err, pkg) {
    if (err) {
      return callback(err);
    }

    options.pkg = pkg;
    var pr = options.prerelease || self.profile.get('prerelease');

    if (pr) {
      if (!semver.isStable(pkg.version)) {
        return callback({
          code: 'ALREADY_PRERELEASE_VERSION',
          message: '"' + pkg.name + '@' + pkg.version + '" is already a prerelease version. '
            + 'Refuses to `cortex publish --prerelease ' + pr + '`.',
          data: {
            name: pkg.name,
            version: pkg.version,
            prerelease: pr
          }
        });
      }

      pkg.version = semver_helper.add_prerelease(pkg.version, pr);
      self.logger.info('publish as {{cyan ' + pr + '}} pre-release version.');
    }

    callback(null);
  });
};


publish.run_prepublish_script = function(options, callback) {
  if (!options.prepublish) {
    return callback(null);
  }

  var pkg = options.pkg;
  var scripts = makeArray(
    pkg.scripts && (
      'prepublish' in pkg.scripts
        ? pkg.scripts.prepublish
        // if prepublish is not defined, try to use prebuild
        : pkg.scripts.prebuild
    )
  )
  // skip empty scripts
  .filter(Boolean);

  if (!scripts.length) {
    return callback(null);
  }

  var self = this;

  this.logger.info('{{cyan run}} "scripts.prepublish" ...');

  run_scripts(scripts, options).on('spawn', function(command) {
    self.logger.info('{{cyan exec}} "' + command + '" ...');

  }).on('close', function(code, signal) {
    if (code) {
      callback({
        code: 'PREPUBLISH_FAILS',
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


publish.pack = function(options, callback) {
  var temp_package = options.temp_package;
  var file = options.tar = node_path.join(options.temp_dir, 'package.tgz');
  var self = this;
  var cwd = options.cwd;

  pf({
    cwd: cwd,
    pkg: options.pkg,
    more: true,
    ignore: '/package.json'
  }, function (err, files) {
    if (err) {
      return callback(err);
    }

    async.series([
      function (done) {
        self.copy(files, cwd, temp_package, done);
      },
      function (done) {
        fse.writeJSON(
          node_path.join(temp_package, 'cortex.json'),
          options.pkg,
          done
        );
      },
      function (done) {
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
