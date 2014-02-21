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
            if ( action === 'delete' ) {
                action = 'del';
            }

            done(null, action);
        }
    },

    value: {
        type: String,
        info: 'the value of the action, might leave it blank which depends.',
        setter: function (value) {
            if ( !value ) {
                var remain = this.get('_');
                value = remain.shift();
            }

            return value;
        }
    }
};

exports.info = 'Manage {{cortex}} profiles. \n' 
    + '    Profiles are set of frequent configurations which you can switch between.';

exports.usage = [
    'cortex profile <action> <value>',
    // '{{name}} cortex --action <action> --value <value>',
    '',
    'Where <action> is one of:',
    '  add <name>       : add a new profile called <name>',
    '  use <name>       : switch to profile <name> if exists',
    '  del/delete <name>: delete a profile if exists',
    '  list             : list all profile names'
];


function displayUsage () {
    return exports.usage.join('\n');
}


