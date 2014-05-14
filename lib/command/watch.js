'use strict';

var watch       = module.exports = {};

// var node_fs = require('fs');
var node_path   = require('path');
var stares      = require('stares');
var ignore      = require('ignore');
var pkg_helper  = require('../util/package');
var lang        = require('../util/lang');
var expand      = require('fs-expand');
var async       = require('async');


// @param {Object} options
// - cwd: {Array.<path>}
watch.run = function(options, callback) {
  var self = this;

  self.watcher = stares({
    port: self.profile.get('watcher_rpc_port')

    // only emitted on master watcher process
  }).on('all', function(event, filepath) {
    // cortex commander will santitize filepath to the right root directory of the repo
    self._rebuild(options, filepath);

    // only emitted on master watcher process
  }).on('message', function(msg) {
    if (~['watch', 'unwatch'].indexOf(msg.task)) {
      if (process.pid !== msg.pid) {
        self.logger.info('incomming {{cyan ' + msg.task + '}} request from process <' + msg.pid + '>.');
      }
    }
  });

  options.stop ?
    self.unwatch(options, callback) :
    self.watch(options, callback);
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

      self.watcher.watch(files, function(err) {
        if (err) {
          return done(err);
        }

        self.logger.debug('watched', arguments);
        done(null);
      });
    });

  }, callback);
};


watch._get_files = function(cwd, callback) {
  pkg_helper.get_original_package(cwd, function(err, pkg) {
    if (err) {
      return callback(err);
    }

    var ignore_rules = lang.object_member_by_namespaces(pkg, 'cortex.ignore', []);

    expand('**', {
      cwd: cwd,
      dot: true

    }, function(err, files) {
      if (err) {
        return callback(err);
      }

      var filter = ignore()
        .addIgnoreFile(
          ignore.select([
            '.cortexignore',
            '.npmignore',
            '.gitignore'
          ])
      ).
      addPattern(ignore_rules).
      createFilter();

      files = files
        .filter(filter)
      // resolve the path, so the filepath won't get wrong if request to another process
      .map(function(file) {
        return node_path.join(cwd, file);
      });

      callback(null, files);
    });
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


// use this trick to prevent endless rebuilding 
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

  var main_cwd = options['main-cwd'];

  if (main_cwd) {
    argv.push('--entry-cwd', main_cwd);
  }

  var commander = self.commander;
  var parsed = commander.parse(argv, function(err, result, details) {
    if (err) {
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
        self.logger.info('{{red|bold ERR!}}', err);
      }
    });
  });
};