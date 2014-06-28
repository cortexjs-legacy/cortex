'use strict';

var node_path   = require('path');
var node_url    = require('url');
var lang        = require('../util/lang');
var cortex_json = require('read-cortex-json');
var async       = require('async');
var shrinked    = require('shrinked');
var fs          = require('fs');
var deps_helper = require('../util/deps');

////////////////////////////////////////////////////////////////////////
// See ./README.md for details
////////////////////////////////////////////////////////////////////////

exports.shorthands = {
  c: 'cwd',
  r: 'recursive',
  g: 'global'
};

exports.options = {

  // Indicates that user want to save something into package.json
  // _save: {
  //   type: Boolean,
  //   enumerable: false,
  //   default: false
  // },

  recursive: {
    type: Boolean,
    info: 'install all dependencies recursively. If `false`, cortex will only download the current package.',
    default: true
  },

  cwd: {
    type: node_path,
    info: 'current working directory.',
    // `cortex install` could be executed anywhere
    default: process.cwd(),
    setter: function(cwd) {
      // Save the origin cwd
      this.set('_cwd', cwd);

      var done = this.async();
      // if not inside a project, returns null
      cortex_json.package_root(this.get('cwd'), function (cwd) {
        done(null, cwd);
      });
    }
  },

  'global': {
    enumerable: false,
    type: Boolean,
    info: 'install packages globally.'
  },

  // if --save --save-async, --save-async will be ignored
  save: {
    type: Boolean,
    info: 'package will appear in your "cortex.dependencies" of cortex.json.',
    setter: save_check_package
  },

  'save-async': {
    type: Boolean,
    info: 'package will appear in your "cortex.asyncDependencies" of cortex.json.',
    setter: save_check_package
  },

  'save-dev': {
    type: Boolean,
    info: 'package will appear in your "cortex.devDependencies" of cortex.json.',
    setter: save_check_package
  },

  // 'save-engine': {
  //   type: Boolean,
  //   info: 'package will appear in your "cortex.engines" of cortex.json.',
  //   validator: save_check_package
  // },

  clone: {
    type: Boolean,
    info: 'try to clone the package repo down to the workspace.'
  },

  production: {
    type: Boolean,
    info: 'ignore "devDependencies". Only works when `cortex install` runs on local without arguments.',
    setter: function (production) {
      // When user executes `cortex install --production`,
      // cortex will not install devDependencies
      var keys = this.get('production')
        ? deps_helper.PRODUCTION_DEP_KEYS
        : deps_helper.NON_PRODUCTION_DEP_KEYS;

      this.set('_keys', keys);
      return production;
    }
  },

  _desc: {
    enumerable: false,
    type: String,
    info: 'which will display at the beginning',
    default: 'installing'
  },

  _update: {
    enumerable: false,
    type: Boolean,
    info: 'if true, cortex will not read cortex-shrinkwrap.json'
  },

  packages: {
    enumerable: false,
    // command line type: String
    // programmatical type: Array.<string>
    info: 'packages to install. if not specified, cortex will read them from your package.json. if you install a package without version, cortex will try to install the latest one.',
    setter: function(packages) {
      var done = this.async();
      exports._deal_packages(packages, this, done);
    }
  }
};


function save_check_package(save) {
  var done = this.async();

  // There must be only one save type
  if (this.get('_save')) {
    return done(null, false);
  }

  // if --save, package.json must exists
  if (save) {
    // NS: see ./README.md
    var g = this.get('global');
    if (g) {
      return done({
        code: 'INSTALL_SAVE_GLOBAL',
        message: '`cortex install --global --save` makes no sense.'
      });
    }

    // CNS: see ./README.md
    var cwd = this.get('cwd');
    // 'cortex install' might be called inside a subtle directory of the project.
    if (cwd === null) {
      return done({
        code: 'SAVE_CORTEX_JSON_NOT_FOUND',
        message: 'cortex.json not found, could not save dependencies'
      });
    }

    // options._save: internal use
    // Indicates `cortex install` is going to save dependencies of either type
    this.set('_save', true);
  }

  done(null, save);
}


// @param {Object} options
// - pkg
// - cwd
// - save
// - remain
exports._deal_packages = function(packages, self, callback) {
  // Invalid option
  // ```
  // cortex install --packages
  // ```
  if (packages === true) {
    return callback({
      code: 'INSTALL_INVALID_PKGS',
      message: 'invalid value of option --packages, which must be specified.',
      data: {
        option: 'packages'
      }
    });
  }

  // 1. 
  // Install packages which explicitly defined in option --packages
  // ```
  // #　could be executed anywhere
  // cortex install --packages ajax,lang
  // ```
  var parsed_packages = [];
  if (packages) {
    parsed_packages = packages.split(/\s*,\s*/);
  }

  // 2. 
  // Install packages in argv.remain
  // ```
  // #　could be executed anywhere
  // cortex install ajax lang
  // ```
  var remain = self.get('_');
  if (!parsed_packages.length && remain.length) {
    parsed_packages = remain;
  }

  var g = self.get('global');
  var package_root = self.get('cwd');
  var cwd = self.get('_cwd');
  var save = self.get('_save');

  // NP, see ./README.md
  if (!package_root && !parsed_packages.length) {
    return callback({
      code: 'CAN_NOT_READ_DEPS',
      message: 'Can not read dependencies. '
        + 'Cortex can\'t find a "cortex.json" file in "' + cwd + '".',
      data: {
        cwd: cwd
      }
    });
  }

  if (parsed_packages.length) {
    // NC(G), see ./README.md
    if (g) {
      return callback(null, exports._santitize(parsed_packages));
    }

    // NC(A), see ./README.md
    if (!package_root) {
      self.set('cwd', cwd);
      return callback(null, exports._santitize(parsed_packages));
    }
  }

  // Else, we need to check current packages
  //////////////////////////////////////////////////////////////////
  cortex_json.read(package_root, function (err, pkg) {
    if (err) {
      return callback(err);
    }

    var deps = exports._deps_from_pkg(pkg, self.get('_keys'));
    var name = pkg.name;
    if (name in deps) {
      return callback({
        code: 'DEPEND_ON_SELF',
        message: 'Invalid dependencies, '
          + '"' + name + '" can {{bold NOT}} depend on itself.',
        data: {
          name: name
        }
      });
    }

    // R, see ./README.md
    // We will not check duplication if `cortex install` with no arguments
    if (!parsed_packages.length) {
      // Ignore --save*
      self.set('_save', false);
      return exports._get_deps(pkg, deps, self, callback);
    }

    exports._check_packages(pkg, parsed_packages, save, callback);
  });
};


exports._deps_from_pkg = function (pkg, keys) {
  var deps = {};
  // But cortex will not install 
  // 'asyncDependencies' and 'devDependencies' recursively which handled by neuropil.
  keys.forEach(function(key) {
    lang.mix(deps, pkg[key]);
  });
  return deps;
};


exports._get_deps = function (pkg, deps, self, callback) {
  var keys = self.get('_keys');

  function deps_from_pkg () {
    callback(null, exports._make_deps_array(deps));
  }

  // `cortex update` with no arguments
  // then we should not read packages from cortex-shrinkwrap.json
  if (self.get('_update')) {
    return deps_from_pkg();
  }

  var cwd = self.get('cwd');
  var shrinkwrap_json = node_path.join(cwd, 'cortex-shrinkwrap.json');
  fs.exists(shrinkwrap_json, function (exists) {
    if (!exists) {
      return deps_from_pkg();
    }

    self.set('_desc', 'installing from shrinkwrap:');
    self.set('recursive', false);
    return exports._deps_from_shrinkwrap(shrinkwrap_json, pkg, keys, callback);
  });
};


exports._deps_from_shrinkwrap = function (file, pkg, keys, callback) {
  shrinked(file, {
    // #413
    // Actually, shrinked tree does not contains devDependencies for now
    dependencyKeys: keys
  }, function (err, tree) {
    if (err) {
      return callback(err);
    }

    var pkg_name = pkg.name;
    var packages = Object.keys(tree).reduce(function (prev, name) {
      // Should not install itself
      if (name === pkg_name) {
        return prev;
      }

      var versions = Object.keys(tree[name]);
      var pkgs = versions.map(function (version) {
        return name + '@' + version;
      });
      return prev.concat(pkgs);
    }, []);

    var dev_deps = exports._deps_from_pkg(pkg, ['devDependencies']);
    packages = packages.concat(exports._make_deps_array(dev_deps));
    callback(null, packages);
  });
};


exports._make_deps_array = function(map) {
  var deps = [];
  // -> ['a@0.0.2']
  Object.keys(map).forEach(function(name) {
    deps.push(name + '@' + map[name]);
  });
  return deps;
};


exports._santitize = function(packages) {
  return packages.map(function(p) {
    var splitted = p.split('@');
    return splitted[0] + '@' + (splitted[1] || '*');
  });
};


exports._check_packages = function(pkg, packages, save, callback) {
  var pkg_name = pkg.name;
  var error;
  var map = {};

  function cb (err, packages) {
    if (error) {
      return;
    }

    if (err) {
      error = true;
    }

    callback(err, packages);
  }

  packages = packages.map(function (p) {
    if (error) {
      return;
    }
    var splitted = p.split('@');
    var name = splitted[0];
    // CS, see ./README.md
    if (pkg_name === name) { 
      return ~cb({
        code: 'INSTALL_SELF',
        message: 'Refusing to install "' + pkg_name + '" as a dependency of itself.',
        data: {
          name: name
        }
      });
    }

    // CV, see ./README.md
    if (save && (name in map)) {
      return ~cb({
        code: 'SAVE_MULTI_VERSIONS',
        message: 'With the "--save" option, '
          + 'installing more than one version of the package "' + name + '" is prohibited.',
        data: {
          name: name
        }
      });
    }
    map[name] = true;
    return name + '@' + (splitted[1] || '*');
  });

  cb(null, packages);
};


exports.info = 'Install specified packages or install packages from package.json';

exports.usage = [
  '{{name}} install <package>[,<package>[,...]]',
  '{{name}} install [options]'
];
