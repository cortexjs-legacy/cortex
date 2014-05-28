'use strict';

var node_path   = require('path');
var node_url    = require('url');
var lang        = require('../util/lang');
var pkg_helper  = require('../util/package');
var async       = require('async');
var shrinked    = require('shrinked');
var fs          = require('fs');


exports.shorthands = {
  c: 'cwd',
  r: 'recursive'
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
      var done = this.async();
      // if not inside a project, returns null
      pkg_helper.repo_root(this.get('cwd'), function (cwd) {
        done(null, cwd);
      });
    }
  },

  // if --save --save-async, --save-async will be ignored
  save: {
    type: Boolean,
    info: 'package will appear in your "cortex.dependencies" of cortex.json.',
    validator: save_check_package
  },

  'save-async': {
    type: Boolean,
    info: 'package will appear in your "cortex.asyncDependencies" of cortex.json.',
    validator: save_check_package
  },

  'save-dev': {
    type: Boolean,
    info: 'package will appear in your "cortex.devDependencies" of cortex.json.',
    validator: save_check_package
  },

  'save-engine': {
    type: Boolean,
    info: 'package will appear in your "cortex.engines" of cortex.json.',
    validator: save_check_package
  },

  clone: {
    type: Boolean,
    info: 'try to clone the package repo down to the workspace.'
  },

  production: {
    type: Boolean,
    info: 'ignore "devDependencies". Only works when not explicitly specify package to install'
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
      var remain = this.get('_') || [];

      exports._deal_packages({
        remain: remain,
        cwd: this.get('cwd'),
        save: this.get('_save'),
        update: this.get('_update'),
        production: this.get('production'),
        packages: packages,
        context: this

      }, done);
    }
  }
};


function save_check_package(save) {
  var done = this.async();

  // if --save, package.json must exists
  if (save) {
    var cwd = this.get('cwd');

    // 'cortex install' might be called inside a subtle directory of the project.
    if (cwd === null) {
      return done('package.json not found, could not save dependencies');
    }

    this.set('cwd', cwd);
    // options._save: internal use
    this.set('_save', true);
  }

  done(null);
}


// @param {Object} options
// - pkg
// - cwd
// - save
// - remain
exports._deal_packages = function(options, callback) {
  var parsed_packages = [];

  // Invalid value
  // ```
  // cortex install --packages
  // ```
  if (options.packages === true) {
    return callback({
      code: 'EINVALID',
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
  if (options.packages) {
    parsed_packages = options.packages.split(/\s*,\s*/);
  }

  // 2. 
  // Install packages in argv.remain
  // ```
  // #　could be executed anywhere
  // cortex install ajax lang
  // ```

  // Object `remain` might be a mocked argv object,
  // so, be careful, and do some tests
  if (!parsed_packages.length && options.remain.length) {
    parsed_packages = options.remain;
  }

  if (options.save) {
    // if --save or --save-async,
    // there must inside a repo, or we will not be able to save dependencies
    if (!parsed_packages.length) {
      return callback({
        code: 'ENONETOSAVE',
        message: 'if --save, you must specify the packages to install.'
      });
    }
    // else we should check the packages

  } else {
    if (parsed_packages.length) {
      return callback(null, exports._santitize_packages(parsed_packages));
    }
    // else we will fetch packages from dependencies
  }

  // 3. 
  // Install packages from dependencies of package.json, 
  // ```
  // # in this case, must executed inside a repo
  // cortex install
  // ```
  
  var cwd = options.cwd;
  if (cwd === null) {
    if (options.save) {
      return callback({
        code: 'ECOULDNOTSAVE',
        message: 'Directory "' + cwd + '" is not inside a repo, could not save dependencies.',
        data: {
          cwd: cwd
        }
      });

    } else {
      return callback({
        code: 'ENOTAREPO',
        message: 'Directory "' + cwd + '" is not inside a repo, could not fetch dependencies.',
        data: {
          cwd: cwd
        }
      });
    }
  }

  exports._get_pkg(cwd, function(err, pkg) {
    if (err) {
      return callback(err);
    }

    // We will not check duplication if `cortex install` with no arguments
    if (!parsed_packages.length) {
      return exports._get_packages(pkg, options, callback);
    }

    // if --save, we should not install more than one version of a certain package
    var allow_duplicate_versions = !options.save;

    // check packages and duplication
    exports._check_packages(parsed_packages, pkg, function(err) {
      if (err) {
        return callback(err);
      }
      callback(null, exports._santitize_packages(parsed_packages));
    }, allow_duplicate_versions);
  });
};


// Get packages from cortex.json or cortex-shrinkwrap.json
exports._get_packages = function (pkg, options, callback) {
  // `cortex update` with no arguments
  // then we should not read packages from cortex-shrinkwrap.json
  if (options.update) {
    return exports._packages_from_cortex_json(pkg, options, callback);
  }

  var shrinkwrap_json = node_path.join(options.cwd, 'cortex-shrinkwrap.json');
  fs.exists(shrinkwrap_json, function (exists) {
    if (exists) {
      options.context.set('_desc', 'installing from shrinkwrap:');
      return exports._packages_from_shrinkwrap_json(shrinkwrap_json, pkg, options, callback);
    }

    exports._packages_from_cortex_json(pkg, options, callback);
  });

  
  // If `deps_map` is an empty object, we will allow this.
  // Users might exec `cortex install` inside a repo which has no deps.
};


var PRODUCTION_DEP_KEYS = ['engines', 'dependencies', 'asyncDependencies'];
var NON_PRODUCTION_DEP_KEYS = ['engines', 'dependencies', 'asyncDependencies', 'devDependencies'];

exports._packages_from_shrinkwrap_json = function (file, pkg, options, callback) {
  shrinked(file, {
    dependencyKeys: options.production
      ? PRODUCTION_DEP_KEYS
      : NON_PRODUCTION_DEP_KEYS
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

    callback(null, packages);
  });
};


exports._packages_from_cortex_json = function (pkg, options, callback) {
  // Including all versions
  var deps_map = exports._get_all_deps(pkg, options.production);
  callback(null, exports._make_deps_array(deps_map));
};


exports._get_pkg = function(cwd, callback) {
  pkg_helper.get_original_package(cwd, callback);
};


exports._get_all_deps = function(pkg, production) {
  var deps_obj = {};

  // When user executes `cortex install --production`,
  // cortex will not install devDependencies
  var keys = production
      ? PRODUCTION_DEP_KEYS
      : NON_PRODUCTION_DEP_KEYS;

  // But cortex will not install 
  // 'asyncDependencies' and 'devDependencies' recursively which handled by neuropil.
  keys.forEach(function(key) {
    lang.mix(deps_obj, pkg[key]);
  });

  return deps_obj;
};


exports._make_deps_array = function(map) {
  var deps = [];

  // -> ['a@0.0.2']
  Object.keys(map).forEach(function(name) {
    deps.push(name + '@' + map[name]);
  });

  return deps;
};


exports._santitize_packages = function(packages) {
  return packages.map(function(module) {
    var splitted = module.split('@');
    return splitted[0] + '@' + (splitted[1] || 'latest');
  });
};


exports._check_packages = function(packages, pkg, callback, allow_duplicate_versions) {
  if (allow_duplicate_versions) {
    // prohibited: a a
    // allow: a@0.0.1 a@0.0.2
    exports._check_duplicate_packages(packages, callback);
  } else {
    // prohibited: a@0.0.1 a@0.0.2
    // prohibited: a a 
    // allow: a@0.0.1 b
    exports._check_duplicate_versions(packages, pkg, callback);
  }
};


// There should be no duplicate packages.
// There should be no duplicate versions of a same package
exports._check_duplicate_versions = function(packages, pkg, callback) {
  var map = {};

  var pkg_name = pkg.name;

  // if no error 
  var pass = !packages.some(function(module) {
    var name = module.split('@')[0];

    if (pkg_name === name) {
      return~ callback('You should not install a package "' + name + '" into itself.');

    } else if (!(name in map)) {
      map[name] = true;

    } else {
      return~ callback(
        'With the "--save" option, ' + 'installing more than one version of the package "' + name + '" is prohibited.'
      );
    }
  });

  if (pass) {
    callback(null);
  }
};

// There should be no duplicate packages.
exports._check_duplicate_packages = function(packages, callback) {
  var map = {};

  // if no error 
  var pass = !packages.some(function(module) {
    if (!(module in map)) {
      map[module] = true;

    } else {
      return~ callback('Duplicate installation of package "' + module + '".');
    }
  });

  if (pass) {
    callback(null);
  }
};


exports.info = 'Install specified packages or install packages from package.json';

exports.usage = [
  '{{name}} install <package>[,<package>[,...]]',
  '{{name}} install [options]'
];