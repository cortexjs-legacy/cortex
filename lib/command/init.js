'use strict';

var init      = exports;
var node_path = require('path');
var fs        = require('fs');
var asks      = require('asks');
var spawn     = require('child_process').spawn;
var prompts   = require('cortex-init-prompts');
var generator = require('cortex-scaffold-generator');
var pkg_helper = require('../util/package');

////////////////////////////////////////////////////////////////
generator.availableLicences = function () {
  return ['MIT'];
};
////////////////////////////////////////////////////////////////

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
    self._prompt(options, function () {
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

    callback(!files.length);
  });
};


// Creates new projects
init._new = function (options, callback) {
  this.logger.info(
    '\n' + 
    '{{underline To create the scaffold, Cortex wants to ask you some questions:}}'
  );

  prompts({
    licences: generator.availableLicences()
  }, function (results) {
  });
};


// Generates the current project.
init._generate = function () {
  
};


init._fulfill_cortex_json = function () {
  
};


init._write_cortex_json = function (pkg, callback) {
  
};


var SCHEMA = [{
  name: 'choice',
  message: 'For the current directory is not empty, what should cortex do?',
  type: 'list',
  choices: [
    'Ignore: ignore existing files, and initialize other files.',
    'Override: override existing files.',
    'Update: only help me update and fulfill cortex.json file.',
    'Cancel: cancel initializing.'
  ]
}];

var CHOICES = {
  U: 'updating',
  C: 'none',
  O: 'overriding',
  I: 'ignoring'
};


init._prompt = function (options, callback) {
  asks.prompt(SCHEMA, function (result) {
    var choice = CHOICES[result.choice.slice(0, 1)];
    options._force = choice;
    callback();
  });
};
