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

var AVAILABLE_ACTIONS = [
  'list',
  'edit',
  'delete',
  'get',
  'set'
];
exports.AVAILABLE_ACTIONS = AVAILABLE_ACTIONS;

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
          return done('You must specify a sub command.');
        }

        if (!~AVAILABLE_ACTIONS.indexOf(sub)) {
          var list = AVAILABLE_ACTIONS.map(function (s) {
            return '"' + s + '"';
          }).join(', ')

          return done('Invalid sub command. A sub command could only be one of ' + list + '.');
        }
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
      var done = this.async();

      if (!value) {
        var remain = this.get('_');
        value = remain.shift();
      }

      if (!value) {
        var sub = this.get('sub-command');
        if (sub === 'set') {
          return done('You should specify the value to be set to');
        }
      }

      done(null, value);
    }
  }
};

exports.info = 'Show or set cortex options.';

exports.usage = [
  '{{name}} config set <name> <value>',
  '{{name}} config get <name>',
  '{{name}} config delete <name>',
  '{{name}} config delete --delete-all',
  '{{name}} config list',
  '{{name}} config edit'
];

exports.sections = [
  {
    caption: 'Sub-commands',
    content: [
      '{{bold set}}'
    ]
  }
];

