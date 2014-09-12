'use strict';

var fse = require('fs-extra');
var node_path = require('path');

var AVAILABLE_CHOICES = [
  'updating',
  'overriding',
  'ignoring',
  'none' // cancel
];

exports.AVAILABLE_CHOICES = AVAILABLE_CHOICES;

exports.options = {
  cwd: {
    type: node_path,
    info: 'current working directory.',
    // `cortex init --cwd` could be executed anywhere
    default: process.cwd(),
    set: function (cwd, is_default) {
      var done = this.async();
      // if (is_default) {
      //   this.set('_current_dir', true);
      // }

      fse.mkdirs(cwd, function (err) {
        if (err) {
          return done({
            code: 'EMKDIRP',
            message: 'Unable to create "' + cwd + '": ' + err.stack,
            data: {
              dir: dir,
              error: err
            }
          });
        }

        done(null, cwd);
      });
    }
  },

  _force: {
    enumerable: false,
    info: 'if the cwd is not empty, what would cortex do.',
    validate: function (value, is_default) {
      var done = this.async();
      if (!is_default && !~AVAILABLE_CHOICES.indexOf(value)) {
        return done(
          'option `_force` only could be one of '
          + AVAILABLE_CHOICES.map(function (choice) {
            return '"' + choice + '"';
          }).join(', ')
          + ' or (undefined)'
        );
      }

      done(null, value);
    }
  },

  template: {
    info: 'the name of template which the new project will be initialized from.',
    set: function(template){
      var done = this.async();

      if (!template) {
        var remain = this.get('_');
        template = remain.shift();
      }

      if(!template){
        template = "default";
      }

      done(null, template);
    }
  }
};

exports.info = 'Initialize a repo';

exports.usage = '{{name}} init';