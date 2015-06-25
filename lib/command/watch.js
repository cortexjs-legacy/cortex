'use strict';

var watch       = module.exports = {};

// var node_fs = require('fs');
var node_path   = require('path');
var stares      = require('stares');
var cortex_json = require('read-cortex-json');
var pf          = require('cortex-package-files');
var handler   = require('cortex-command-errors');
var expand      = require('fs-expand');
var async       = require('async');
var ignore      = require('ignore');
var glob        = require('glob');

// @param {Object} options
// - cwd: {Array.<path>}
watch.run = function(options, callback) {
  this._createWatcher(options);
  options.stop ?
    this.unwatch(options, callback) :
    this.watch(options, callback);
};


// Creates a instance of `stares`
watch._createWatcher = function (options) {
  if (this.watcher) {
    return;
  }

  var self = this;
  this.watcher = stares({
    port: self.profile.get('watcher_rpc_port')

    // only emitted on master watcher process
  })
  .on('all', function(event, filepath) {
    options.file = filepath;
    var dir = node_path.dirname(filepath);
    // cortex commander will santitize filepath to the right root directory of the repo
    self._rebuild(options, dir);
  })
  // only emitted on master watcher process
  .on('message', function(msg) {
    if (~['watch', 'unwatch'].indexOf(msg.task)) {
      if (process.pid !== msg.pid) {
        self.logger.info('incomming {{cyan ' + msg.task + '}} request from process <' + msg.pid + '>.');
      }
    }
  })
  .on('listening', function () {
    self.master = true;
  })
  .on('connect', function () {
    if (!self.master) {
      self.logger.info('\nBuilding processes will be delegated to the >>{{cyan MASTER}}<< process.\n');
    }
  });
};


watch.watchFile = function (files, callback) {
  var self = this;
  this.watcher.watch(files, function(err) {
    if (err) {
      return callback(err);
    }

    self.logger.debug('watched', arguments);
    callback(null);
  });
};


watch.watch = function(options, callback) {
  var self = this;
  var init_build = options['init-build'];

  var profile = self.profile;
  var watched = profile.get('watched');

  async.each(options.cwd, function(cwd, done) {
    if (~watched.indexOf(cwd)) {
      self.logger.warn('The current directory has already been watched.');
      return done(null);
    }

    self.logger.info('{{cyan watching}}', cwd, '...');

    if (init_build) {
      self._rebuild(options, cwd, true);
    }

    self._get_files(cwd, function(err, files) {
      if (err) {
        return done(err);
      }
      self.watchFile(files, done);
    });

  }, callback);
};


watch._get_files = function(cwd, callback) {
  glob('**', {
    cwd: cwd,
    // include .dot files
    dot: true,
    // Adds a `/` character to directory matches
    mark: true

  }, function(err, files) {
    if (err) {
      return callback(err);
    }

    var filter = ignore()
    // #420
    // We only filter a few directories even if user ignores them in .gitignore,
    // because most of files will affect the final result of builder.
    .addPattern([
      '/node_modules',
      '/neurons'
    ])
    .createFilter();

    var REGEX_ENDS_BACKSLASH = /\/$/;
    files = files
      // Filter dirs
      .filter(function (file) {
        return !REGEX_ENDS_BACKSLASH.test(file);
      })
      .filter(filter);
    files = files.map(function (f) {
      return node_path.join(cwd, f);
    });

    callback(null, files);
  });
};


watch.unwatch = function(options, callback) {
  var self = this;
  var profile = self.profile;

  async.each(options.cwd, function(cwd, done) {
    self._get_files(cwd, function(err, files) {
      if (err) {
        return done(err);
      }

      self.watcher.unwatch(files, function(err, msg) {
        if (err) {
          (err);
        }

        self.logger.info(cwd, '{{cyan unwatched}}');
        self.logger.debug('unwatched', arguments);
        done(null);
      });
    });
  }, callback);
};


// There will be only one master process of `cortex watch`,
// so, it is ok to use a global variable of flags.
// Use this trick to prevent endless rebuilding
var locked = {};

watch._lock = function(id) {
  locked[id] = true;
};


watch._release = function(id) {
  locked[id] = false;
};


watch._is_locked = function(id) {
  return locked[id];
};


watch._rebuild = function(options, cwd, init) {
  var self = this;

  cortex_json.package_root(cwd, function (root) {
    if (root === null) {
      return self.logger.info('directory "' + cwd +  '" is not inside a project.');
    }

    cwd = root;

    // If the current directory is already under building,
    // just ignore new tasks
    if (self._is_locked(cwd)) {
      return;
    }

    // lock it
    self._lock(cwd);

    // mock process.argv
    var argv = [
      '', '',
      'build',
      // Use --force to prevent grunt task interrupt the current process
      '--force',
      '--cwd', cwd
    ];

    if(options.file){
      argv = argv.concat(['--file', options.file]);
    }

    var prerelease = options.prerelease;
    if (prerelease) {
      argv.push("--prerelease", prerelease);
    }

    var commander = self.commander;
    var parsed = commander.parse(argv, function(err, result, details) {
      if (err) {
        // #421
        setImmediate(function() {
          self._release(cwd);
        });
        return self.logger.info('{{red|bold ERR!}}', err);
      }

      var real_cwd = result.options.cwd;

      // if `cwd` is the same as `real_cwd`,
      // skip checking because we already have checked that
      if (real_cwd !== cwd) {
        if (self._is_locked(real_cwd)) {
          return;
        }

        // also lock the root directory of a repo
        self._lock(real_cwd);
      }

      if (init) {
        result.options.init = true;
        self.logger.info('{{cyan build}} the project when begins to watch...');
      } else {
        self.logger.info('file "' + cwd + '" changed,', '{{cyan rebuild project...}}');
      }

      // exec cortex.commands.build method
      commander.command('build', result.options, function(err) {
        setImmediate(function() {
          self._release(cwd);
          self._release(real_cwd);
        });

        if (err) {
          handler({
            logger: self.logger,
            harmony: true,
            notify: true
          })(err);
        }
      });
    });
  });
};
