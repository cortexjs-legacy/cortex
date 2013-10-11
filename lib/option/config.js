'use strict';

function interactive (value) {
    if(value){
        this.set('interactive', true);
    }

    return value;
};


exports.shorthands = {
    l: 'list',
    e: 'edit'
};


exports.options = {
    list: {
        type: Boolean,
        info: 'show the list of available options.',
        setter: interactive
    },

    edit: {
        type: Boolean,
        info: 'opens an editor to modify the config file.',
        setter: interactive
    },

    unset: {
        type: Boolean,
        info: 'unset an option.'
    },

    'unset-all': {
        type: Boolean,
        info: 'unset all options.'
    },

    name: {
        type: String,
        info: 'the name of the property.',
        setter: function (name) {
            var done = this.async();

            if(this.get('unset-all')){
                return done(null);
            }

            if(!this.get('interactive') && !name){
                var remain = this.get('_');

                // cortex config <key> <value>
                var v = remain.shift();

                if(!v){
                    return done('You must specify a name of the property to be configured');
                }else{
                    return done(null, v);
                }
            }

            done(null);
        }
    },

    value: {
        type: String,
        info: 'the new value of the specified property.',
        setter: function (value) {
            if(this.get('unset-all') || this.get('unset') ){
                return;
            }

            if(!this.get('interactive') && !value){
                var remain = this.get('_');

                // cortex config <key> <value>
                var v = remain.shift();

                return v;
            }
        }
    }
};

exports.info = 'Show or set cortex options.';

exports.usage = [
    '{{name}} config <name> <value>',
    '{{name}} config --list',
    '{{name}} config <name> --unset',
    '{{name}} config --unset-all',
];

