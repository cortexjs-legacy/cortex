'use strict';

exports.options = {
    action: {
        type: String,
        info: 'the action of {{name}} profile.',
        setter: function (action) {
            var done = this.async();

            if ( !action ) {
                var remain = this.get('_');
                action = remain.shift();
            }

            if ( !action ) {
                return done('You must specifiy the action. Usage:\n' + displayUsage());
            }

            // alias
            if ( action === 'delete' || action === 'del' ) {
                action = 'rm';
            }

            done(null, action);
        }
    },

    name: {
        type: String,
        info: 'the profile name or names if necessary.',
        setter: function (value) {
            if ( !value ) {
                var remain = this.get('_');
                value = remain.shift();
            }

            return value;
        }
    },

    'remove-data': {
        type: Boolean,
        info: 'if true, {{name}} profile del <name> will also remove all data of it.',
        setter: function (remove) {
            // User doesn't set 'remove-data' explicitly.
            if ( !remove && !~ process.argv.indexOf('--no-remove-data') ) {
                remove = undefined;
            }
            return remove;
        }
    }
};

exports.info = 'Manage {{cortex}} profiles. \n' 
    + '    Profiles are set of frequent configurations which you can switch between.';

exports.usage = [
    'cortex profile <action> <name>',
    // '{{name}} cortex --action <action> --value <value>',
    '',
    'Where <action> is one of:',
    '  add <name>  : add a new profile',
    '  use <name>  : switch to profile <name> if exists',
    '  rm <name>   : delete a profile if exists',
    '  list        : list all profile names'
];


function displayUsage () {
    return exports.usage.join('\n');
}


