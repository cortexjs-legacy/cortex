'use strict';

function interactive(value) {
  if (value) {
    this.set('interactive', true);
  }

  return value;
};


exports.shorthands = {
  l: 'list',
  e: 'edit'
};

var AVAILABLE_SUB_COMMANDS = [
  'list',
  'edit',
  'delete',
  'get',
  'set'
];
exports.AVAILABLE_SUB_COMMANDS = AVAILABLE_SUB_COMMANDS;

exports.options = {

  'sub-command': {
    type: String,
    info: 'the sub command of cortex config.',
    setter: function (sub) {
      var done = this.async();

      if (!sub) {
        var remain = this.get('_');

        sub = remain.shift();

        if (!sub) {
          return done('You must specify a sub command.\n\n' + displayUsage() );
        }
      }

      // alias
      if (sub === 'unset') {
        sub = 'delete';
      }

      if (!~AVAILABLE_SUB_COMMANDS.indexOf(sub)) {
        return done('Invalid sub command.\n\n' + displayUsage() );
      }

      done(null, sub);
    }
  },

  'delete-all': {
    type: Boolean,
    info: 'unset all options. Only works when the sub command is "delete"',
    setter: function (all) {
      var sub = this.get('sub-command');

      sub = sub === 'delete'
        ? all
        : false;

      return sub;
    }
  },

  name: {
    type: String,
    info: 'the name of the property.',
    setter: function(name) {
      var done = this.async();

      var sub = this.get('sub-command');
      var remain = this.get('_');

      if (!name) {
        name = remain.shift();
      }

      if (!name) {
        if (sub === 'get' || sub === 'set') {
          return done('You must specify a name for "cortex config ' + sub + '"');
        }

        if (sub === 'delete' && !this.get('delete-all')) {
          return done('You must tell cortex which config to delete');
        }
      }

      done(null, name);
    }
  },

  value: {
    type: String,
    info: 'the new value of the specified property.',
    setter: function(value) {
      if (!value) {
        var remain = this.get('_');
        value = remain.shift();
      }

      return value;
    }
  }
};

exports.info = 'Show or set cortex options.';

exports.usage = [
  'cortex config <sub-command> ...',
  // '{{name}} cortex --sub-command <sub-command> --value <value>',
  '',
  'Where <sub-command> is one of:',
  '  set <name> <value> : sets the config to the value',
  '  get <name>         : echo the config value to stdout.',
  '  delete <name>      : unsets a config to default',
  '  delete --delete-all: unsets all configurations',
  '  list               : lists all config settings',
  '  edit               : opens the config file in an editor'
];


function displayUsage() {
  return '{{bold Usage:}}\n' + exports.usage.join('\n');
}
