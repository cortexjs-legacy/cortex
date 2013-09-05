'use strict';

function interactive (value, parsed) {
    if(value){
        parsed.interactive = true;
    }

    return value;
};


exports.options = {
    list: {
        type: Boolean,
        short: 'l',
        info: 'show the list of available options.',
        value: interactive
    },

    edit: {
        type: Boolean,
        short: 'e',
        info: 'opens an editor to modify the config file.',
        value: interactive
    },

    name: {
        type: String,
        info: 'the name of the property.',
        value: function (name, parsed, tools) {
            if(!parsed.interactive && !name){
                var remain = parsed.argv && parsed.argv.remain || [];

                // cortex config <key> <value>
                var v = remain.shift();

                if(!v){
                    tools.error('You must specify a name of the property to be configured');
                }else{
                    return v;
                }
            }
        }
    },

    value: {
        type: String,
        info: 'the new value of the specified property.',
        value: function (value, parsed, tools) {
            if(!parsed.interactive && !value){
                var remain = parsed.argv && parsed.argv.remain || [];

                // cortex config <key> <value>
                var v = remain.shift();

                // TODO:
                // use interactive to set value
                if(!v){
                    tools.error('You must specify the value of the property.');
                }else{
                    return v;
                }
            }
        }
    }
};

exports.info = 'Show or set cortex options.';

exports.usage = [
    '{{name}} config <name> <value>',
    '{{name}} config --list'
];