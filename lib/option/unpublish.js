'use strict';

var node_path   = require('path');
var node_url    = require('url');
var fs          = require('fs-sync');


exports.shorthands = {
    f: 'force',
    c: 'cwd'
};

exports.options = {
    force: {
        type: Boolean,
        info: 'whether to force unpublishing.',
        default: false
    },

    cwd: {
        type: node_path,
        default: process.cwd(),
        info: 'specify the current working directory.'
    },

    module: {
        type: String,
        info: 'the package to be unpublished.',

        // cortex unpublish --pkg a
        // cortex unpublish a

        // @returns {Array.<string>} ATTENSION!
        setter: function(module) {
            var done = this.async();

            if(!module){
                var remain = this.get('_');

                if( remain.length ){
                    module = remain[0];

                }else{
                    var package_file = node_path.join( this.get('cwd'), 'package.json' );

                    if( fs.exists(package_file) ){
                        var json = fs.readJSON(package_file);

                        module = json.name;

                    }else{
                        return done('You must specify a package to unpublish.');
                    }
                }
            }

            done(null, module);
        }
    }
};

exports.info = 'Unpublish a package.';

exports.usage = [
    '{{name}} unpublish [options]',
    '{{name}} unpublish <project>[@<version>] [options]'
];
