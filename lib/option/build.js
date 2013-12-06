'use strict';

var node_path   = require('path');
var fs          = require('fs-sync');
var pkg_helper  = require('../util/package');

var REGEX_ENDS_WITH_JS = '/\.js$/';

exports.shorthands = {
    c: 'cwd',
};

exports.options = {
    // cortex build abc
    cwd: {
        type: node_path,
        info: 'current working directory.',
        default: process.cwd(),

        // `nopt` makes sure `cwd` is an absolute path
        setter: function (cwd) {
            var done = this.async();

            var dir = pkg_helper.repo_root(cwd);

            if(dir === null){
                return done('directory "' + cwd + '" is not inside a project.');
            }

            // get real project root
            done(null, dir);
        }
    },

    clean: {
        type: Boolean,
        info: 'clean the temporary folder after building',
        default: true
    },

    dist: {
        type: node_path,
        info: 'if `dist` folder is specified, "{{name}} build" will treated items under "<dist>/" are already built, and skip building.',
        
        setter: function(dist) {
            var cwd = this.get('cwd');

            if(!dist){
                dist = node_path.join(cwd, 'dist');
            }

            // prevent use an outsider for dist dir
            if ( !fs.exists(dist) || !fs.doesPathContain(cwd, dist) ) {
                dist = undefined;
            }

            return dist;
        }
    },

    publish: {
        type: Boolean,
        info: 'if `false`, will not publish built items into cortex server root.',
        default: true
    },

    ranges: {
        type: Boolean,
        info: 'check ranges and build local files with range pathes.',
        default: true
    },

    define: {
        type: String,
        default: 'define'
    },

    files: {
        type: String,
        info: 'which files to build. cortex will build all javascript files under "lib/" directory by default',
        setter: function(files) {
            var cwd = this.get('cwd');

            // if parsed.dist exists, skip parsing files
            if(this.get('dist') ){
                return [];
            }

            if ( !files ) {
                // build 'lib/' folder by default
                files = fs.expand('lib/**/*.js', {
                    cwd: cwd
                   
                   }).map(function(file) {
                       return node_path.join(cwd, file);
                   });
            
            }else{
                files = files.split(',').map(function(file) {
                    // absolutize
                    var resolved_file = fs.isPathAbsolute(file) ? 
                            // /path/to/search
                            file : 

                            // path/to/search -> {cwd}/path/to/search
                            node_path.join(cwd, file);

                    if(fs.isFile(resolved_file)){
                        // is javascript file and is under `cwd`
                        if(REGEX_ENDS_WITH_JS.test(resolved_file) && fs.doesPathContain(cwd, resolved_file)){
                            return resolved_file;
                        }
                        // ignore other files
                    
                    }else{
                        // /path/to/search -> /path/to/search/**/*.js
                        if(fs.isDir(resolved_file)){
                            resolved_file = node_path.join(resolved_file, '**/*.js');
                        }

                        // /path/to/search/**/*.js
                        // /path/to/search/**
                        // /path/to/search/*.js
                        // /path/to/search/*
                        return fs.expand(resolved_file, {
                            // make sure the result is inside `cwd`
                            cwd: cwd

                        // may contains directories
                        // f -> absolute path
                        }).filter(function(f) {
                            return fs.isFile(f) && REGEX_ENDS_WITH_JS.test(f);
                        });
                    }

                    return false;

                }).filter(function(file) {
                    return !!file;
                
                // flatten
                }).reduce(function(a, b) {
                    return a.concat(b);

                }, []);
            }

            return files;
        }
    }
};


exports.info = 'Build module wrapper, and publish to cortex server root.';

exports.usage = [
    '{{name}} build [options]'
];


