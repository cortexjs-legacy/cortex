'use strict';

var init      = exports;
var node_path = require('path');
var fs        = require('fs');
var fse       = require('fs-extra');
var asks      = require('asks');
var spawn     = require('child_process').spawn;
var prompts   = require('cortex-init-prompts');
var generator = require('cortex-scaffold-generator');
var pkg_helper = require('../util/package');


// @param {Object} options see 'lib/option/adduser.js' for details
init.run = function(options, callback) {
  var self = this;

  this.logger.info([
    'This utility helps to create the basic scaffold for your cortex project.',
    'It will walk you through creating a cortex.json and some other files.',
    '',
    'Use `cortex install <pkg> --save` afterwards to install a package',
    '  and save it as a dependency in the package.json file.',
    '',
    'Press {{cyan ^C}} at any time to quit.\n',

  ].join('\n'));

  this._check_cwd(options.cwd, function (err, empty) {
    if (err) {
      return callback(err);
    }

    options.empty = empty;

    if (empty) {
      options._force = 'overriding';
      return self._run(options, callback);
    }

    if (options._force) {
      return self._run(options, callback);
    }

    // If the dir is not empty, ask 
    self._ask_about_forcing(options, function () {
      self._run(options, callback);
    });
  });
};


init._run = function (options, callback) {
  switch(options._force){
    case 'none':
      this.logger.info('Cancelled by user.');
      return callback(null);

    // case 'updating':
    //   return this._fulfill_cortex_json(options, callback);

    // 'overriding'
    // 'skipping'
    default:
      return this._new(options, callback);
  }
};


init._check_cwd = function (cwd, callback) {
  fs.readdir(cwd, function (err, files) {
    if (err) {
      return callback({
        code: 'EREADDIR',
        message: 'Error reading "' + cwd + '": ' + err.stack,
        data: {
          dir: dir,
          error: err
        }
      });
    }

    callback(null, !files.length);
  });
};


var SKIPPED_MAP = {
  username: 'author_name',
  email: 'author_email'
};
init._skipped = function () {
  var profile = this.profile;
  var skip = {};
  Object.keys(SKIPPED_MAP).forEach(function (key) {
    var value = profile.get(key);
    if (value) {
      skip[SKIPPED_MAP[key]] = value;
    }
  });

  return skip;
};


// Creates new projects
init._new = function (options, callback) {
  this.logger.info(
    '\n' + 
    '{{underline To create the scaffold, Cortex wants to ask you some questions:}}'
  );

  var self = this;
  prompts({
    licenses: generator.availableLicenses(),
    skip: this._skipped()

  }, function (results) {
    options.pkg = results;

    self._confirm_data(options, function (confirm) {
      if (confirm) {
        return self._generate(options, callback);
      }

      self.logger.info('{{red|bold Aborted!}}');
      callback(null);
    });
  });
};


init._confirm_data = function (options, callback) {
  this.logger.info('\n');
  this.logger.info( JSON.stringify(options.pkg, null, 2) );
  this.logger.info('\n');

  asks.prompt([
    {
      name: 'confirm',
      default: true,
      message: 'About to write files. Is this ok?',
      type: 'confirm'
    }
  ], function (result) {
    callback(result.confirm);
  });
};


// Generates the current project.
init._generate = function (options, callback) {
  var self = this;
  generator(options.pkg, {
    override: options._force === 'overriding',
    cwd: options.cwd

  }, callback);
};


// init._fulfill_cortex_json = function (options, callback) {
//   // 
// };


var SCHEMA = [{
  name: 'choice',
  message: 'For the current directory is not empty, what should cortex do?',
  type: 'list',
  choices: [
    'Skip: Skip existing files, and initialize other files.',
    'Override: override existing files.',
    // 'Update: only help me update and fulfill cortex.json file.',
    'Cancel: cancel initializing.'
  ]
}];

var CHOICES = {
  U: 'updating',
  C: 'none',
  O: 'overriding',
  S: 'Skipping'
};


init._ask_about_forcing = function (options, callback) {
  asks.prompt(SCHEMA, function (result) {
    var choice = CHOICES[result.choice.slice(0, 1)];
    options._force = choice;
    callback();
  });
};
