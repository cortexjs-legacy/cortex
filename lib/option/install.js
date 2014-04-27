'use strict';

var node_path   = require('path');
var node_url    = require('url');
var lang        = require('../util/lang');
var pkg_helper  = require('../util/package');
var async       = require('async');


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
    info: 'install all dependencies recursively. If `false`, cortex will only download the current module.',
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
    info: 'package will appear in your "cortex.dependencies" of package.json.',
    validator: save_check_package
  },

  'save-async': {
    type: Boolean,
    info: 'package will appear in your "cortex.asyncDependencies" of package.json.',
    validator: save_check_package
  },

  'save-dev': {
    type: Boolean,
    info: 'package will appear in your "cortex.devDependencies" of package.json.',
    validator: save_check_package
  },

  clone: {
    type: Boolean,
    info: 'try to clone the package repo down to the workspace.',
    default: false
  },

  production: {
    type: Boolean,
    info: 'ignore "devDependencies". Only works when not explicitly specify module to install',
    default: false
  },

  modules: {
    // command line type: String
    // programmatical type: Array.<string>
    info: 'modules to install. if not specified, cortex will read them from your package.json. if you install a module without version, cortex will try to install the latest one.',
    setter: function(modules) {
      var done = this.async();
      var remain = this.get('_') || [];

      exports._get_modules({
        remain: remain,
        cwd: this.get('cwd'),
        save: this.get('_save'),
        production: this.get('production'),
        modules: modules

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
exports._get_modules = function(options, callback) {
  var parsed_modules = [];

  // Invalid value
  // ```
  // cortex install --modules
  // ```
  if (options.modules === true) {
    return callback({
      code: 'EINVALID',
      message: 'invalid value of option --modules, which must be specified.',
      data: {
        option: 'modules'
      }
    });
  }

  // 1. 
  // Install modules which explicitly defined in option --modules
  // ```
  // #　could be executed anywhere
  // cortex install --modules ajax,lang
  // ```
  if (options.modules) {
    parsed_modules = options.modules.split(/\s*,\s*/);
  }

  // 2. 
  // Install modules in argv.remain
  // ```
  // #　could be executed anywhere
  // cortex install ajax lang
  // ```

  // Object `remain` might be a mocked argv object,
  // so, be careful, and do some tests
  if (!parsed_modules.length && options.remain.length) {
    parsed_modules = options.remain;
  }

  if (options.save) {
    // if --save or --save-async,
    // there must inside a repo, or we will not be able to save dependencies
    if (!parsed_modules.length) {
      return callback({
        code: 'ENONETOSAVE',
        message: 'if --save, you must specify the modules to install.'
      });
    }
    // else we should check the modules

  } else {
    if (parsed_modules.length) {
      return callback(null, exports._santitize_modules(parsed_modules));
    }
    // else we will fetch modules from dependencies
  }

  // 3. 
  // Install modules from dependencies of package.json, 
  // ```
  // # in this case, must executed inside a repo
  // cortex install
  // ```
  
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

    // Including all versions
    var deps_map = exports._get_all_deps(pkg, options.production);

    // We will not check `cortex install` 
    if (!parsed_modules.length) {

      // If `deps_map` is an empty object, we will allow this.
      // Users might exec `cortex install` inside a repo which has no deps.
      return callback(null, exports._make_deps_array(deps_map));
    }

    // if --save, we should not install more than one version of a certain module
    var allow_duplicate_versions = !options.save;

    exports._check_modules(parsed_modules, pkg, function(err) {
      if (err) {
        return callback(err);
      }

      callback(null, exports._santitize_modules(parsed_modules));

    }, allow_duplicate_versions);
  });
};


exports._get_pkg = function(cwd, callback) {
  pkg_helper.get_original_package(cwd, callback);
};


exports._get_all_deps = function(pkg, production) {
  var deps_obj = {};

  var keys = ['dependencies', 'asyncDependencies'];
  // When user executes `cortex install --production`,
  // cortex will not install devDependencies
  if (!production) {
    keys.push('devDependencies');
  }

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


exports._santitize_modules = function(modules) {
  return modules.map(function(module) {
    var splitted = module.split('@');
    return splitted[0] + '@' + (splitted[1] || 'latest');
  });
};


exports._check_modules = function(modules, pkg, callback, allow_duplicate_versions) {
  if (allow_duplicate_versions) {
    // prohibited: a a
    // allow: a@0.0.1 a@0.0.2
    exports._check_duplicate_modules(modules, callback);
  } else {
    // prohibited: a@0.0.1 a@0.0.2
    // prohibited: a a 
    // allow: a@0.0.1 b
    exports._check_duplicate_versions(modules, pkg, callback);
  }
};


// There should be no duplicate modules.
// There should be no duplicate versions of a same module
exports._check_duplicate_versions = function(modules, pkg, callback) {
  var map = {};

  var pkg_name = pkg.name;

  // if no error 
  var pass = !modules.some(function(module) {
    var name = module.split('@')[0];

    if (pkg_name === name) {
      return~ callback('You should not install a module "' + name + '" into itself.');

    } else if (!(name in map)) {
      map[name] = true;

    } else {
      return~ callback(
        'With the "--save" option, ' + 'installing more than one version of the module "' + name + '" is prohibited.'
      );
    }
  });

  if (pass) {
    callback(null);
  }
};

// There should be no duplicate modules.
exports._check_duplicate_modules = function(modules, callback) {
  var map = {};

  // if no error 
  var pass = !modules.some(function(module) {
    if (!(module in map)) {
      map[module] = true;

    } else {
      return~ callback('Duplicate installation of module "' + module + '".');
    }
  });

  if (pass) {
    callback(null);
  }
};


exports.info = 'Install specified modules or install modules from package.json';

exports.usage = [
  '{{name}} install <module>[,<modules>[,...]]',
  '{{name}} install [options]'
];