'use strict';

var node_path   = require('path');
var option_cwd  = require('../util/cwd');
var fs = require('fs');

exports.shorthands = {
  c: 'cwd'
};

exports.options = {
  // cortex build abc
  cwd: option_cwd,

  preinstall: {
    enumerable: false,
    type: Boolean,
    default: false
  },

  prebuild: {
    enumerable: false,
    type: Boolean,
    default: true
  },

  dest: {
    type: node_path,

    // default to be profile.built_root
    info: 'the destination directory to be built into',
    set: function (dest) {
      var done = this.async();

      function cb (err) {
        // '/abc/' -> '/abc'
        done(err || null, node_path.resolve(dest));
      }

      if (!dest) {
        dest = node_path.join(this.get('cwd'), 'neurons');
        // legacy
        // If `neurons` exists and is not a directory, try to unlink it.
        fs.lstat(dest, function (err, stat) {
          if (err) {
            if (err.code === 'ENOENT') {
              return cb();
            }
            return cb(err);
          }

          if (stat.isDirectory()) {
            return cb();
          }

          fs.unlink(dest, cb);
        });
        return;
      }

      cb();
    }
  },

  config: {
    type: Boolean,
    info: 'whether will generate configurations.',
    default: true
  },

  'install-build': {
    enumerable: false,
    type: Boolean,
    info: 'install build will skip creating symlink, creating engines, generating configurations, etc.',
    default: false
  },

  prerelease: {
    enumerable: false,
    info: 'build as a pre-release package.'
  }
};


exports.info = 'Build module wrapper, and publish to cortex server root.';

exports.usage = [
  '{{name}} build [options]'
];
