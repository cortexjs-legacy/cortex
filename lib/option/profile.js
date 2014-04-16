'use strict';

exports.options = {
  'sub-command': {
    type: String,
    info: 'the sub command of {{name}} profile.',
    setter: function(sub) {
      var done = this.async();

      if (!sub) {
        var remain = this.get('_');
        sub = remain.shift();
      }

      if (!sub) {
        return done('You must specifiy the sub-command. Usage:\n' + displayUsage());
      }

      // alias
      if (sub === 'delete' || sub === 'del' || sub === 'remove') {
        sub = 'rm';
      }

      if (sub === 'list') {
        sub = 'ls';
      }

      done(null, sub);
    }
  },

  name: {
    type: String,
    info: 'the profile name or names if necessary.',
    setter: function(value) {
      if (!value) {
        var remain = this.get('_');
        value = remain.shift();
      }

      return value;
    }
  },

  'remove-data': {
    type: Boolean,
    info: 'if true, {{name}} profile del <name> will also remove all data of it.',
    setter: function(remove) {
      // User doesn't set 'remove-data' explicitly.
      if (!remove && !~process.argv.indexOf('--no-remove-data')) {
        remove = undefined;
      }
      return remove;
    }
  }
};

exports.info = 'Manage {{cortex}} profiles. \n' + '    Profiles are set of frequent configurations which you can switch between.';

exports.usage = [
  'cortex profile <sub-command> <name>',
  // '{{name}} cortex --sub-command <sub-command> --value <value>',
  '',
  'Where <sub-command> is one of:',
  '  add <name>  : add a new profile',
  '  use <name>  : switch to profile <name> if exists',
  '  rm <name>   : delete a profile if exists',
  '  ls/list     : list all profile names'
];


function displayUsage() {
  return exports.usage.join('\n');
}