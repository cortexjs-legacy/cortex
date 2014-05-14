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

    case 'updating':
      return this._fulfill_cortex_json(options, callback);

    // 'overriding'
    // 'ignoring'
    default:
      return this._new(options, callback)
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


// Creates new projects
init._new = function (options, callback) {
  this.logger.info(
    '\n' + 
    '{{underline To create the scaffold, Cortex wants to ask you some questions:}}'
  );

  var self = this;
  prompts({
    licenses: generator.availableLicenses()
  }, function (results) {
    options.pkg = self._clean_pkg(results);
    self._generate(options, callback);
  });
};


init._clean_pkg = function (results) {
  return results;
};


// Generates the current project.
init._generate = function (options, callback) {
  var self = this;
  generator(options.pkg, {
    override: options._force === 'overriding',
    cwd: options.cwd

  }, function (err) {
    if (err) {
      return callback(err);
    }

    self._write_cortex_json(options, callback);
  });
};


init._fulfill_cortex_json = function (options, callback) {
  // 
};


init._write_cortex_json = function (options, callback) {
  var cortex_json = node_path.join(options.cwd, 'cortex.json');
  fse.outputJson(cortex_json, options.pkg, function (err) {
    if (err) {
      return callback({
        code: 'EWRITEJSON',
        message: 'Failed to write json file "' + cortex_json + '": ' + err.stack,
        data: {
          error: err,
          json: options.pkg,
          file: cortex_json
        }
      });
    }

    callback(null);
  });
};


var SCHEMA = [{
  name: 'choice',
  message: 'For the current directory is not empty, what should cortex do?',
  type: 'list',
  choices: [
    'Ignore: ignore existing files, and initialize other files.',
    'Override: override existing files.',
    // 'Update: only help me update and fulfill cortex.json file.',
    'Cancel: cancel initializing.'
  ]
}];

var CHOICES = {
  U: 'updating',
  C: 'none',
  O: 'overriding',
  I: 'ignoring'
};


init._ask_about_forcing = function (options, callback) {
  asks.prompt(SCHEMA, function (result) {
    var choice = CHOICES[result.choice.slice(0, 1)];
    options._force = choice;
    callback();
  });
};
