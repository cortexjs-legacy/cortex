'use strict';

module.exports = build;

var checker     = require('../util/check-wrapper');
var lang        = require('../util/lang');
var wrapper     = require('../util/wrapper');

var logger      = require('../logger');
var i18n        = require('../i18n');
var MESSAGE     = i18n.require('command-build');

var uglifyjs    = require('uglify-js');
var fs          = require('fs-sync');
var async       = require('async');
var node_path   = require('path');

var profile             = require('cortex-profile');
var CORTEX_ROOT         = profile.option('cortex_root');
var CORTEX_BUILT_ROOT   = profile.option('built_root');
var CORTEX_BUILT_TEMP   = profile.option('built_temp');

var REGEX_ENDS_WITH_JS = /\.js$/;

var ENSURE_PROPERTY = {
    name: {
        err: MESSAGE.NAME_MUST_BE_DEFINED
    },

    version: {
        err: MESSAGE.VER_MUST_BE_DEFINED
    }
};

function check_package(pkg){
    var err;

    Object.keys(ENSURE_PROPERTY).some(function(key, config) {
        if(!pkg[key]){
            err = config.err;
        }

        return err;
    });

    return err;
}


function is_relative_path(str){
    return str.indexOf('../') === 0 || str.indexOf('./') === 0;
}


function ensure_js_ext(path) {
    return REGEX_ENDS_WITH_JS.test(path) ?
            path :
            path + '.js';
}

// with no fault tolerance with arguments
// no arguments overloading

// @param {Object} options
// - cwd: {node_path} absolute dir
// X - separator: {string}
// - define: {string}
// X - output: {node_path} the path of the ouput file, ending with '.js'
// - dist: {node_path} 
// - files: {Array.<string>} array of **absolute** file paths to be built all of which will be built into options.output
function build(options, callback) {
    build.build_files(options, function(err, data) {
        if(err){
            return callback(err);
        }

        if(options.publish){
            build.publish(data, callback);
        }else{
            callback(null);
        }
    });
};

build.build_files = function(options, callback) {
    var built_folder;
    var cwd = options.cwd;
    var pkg = fs.readJSON( node_path.join(options.cwd, 'package.json') );
    
    // main entrance:
    // {
    //      main: 'test/fixtures/main.js',
    //      name: 'module'
    //      version: '0.0.1'
    // }
    // 
    // expected
    //      src: ''
    //
    // unexpected:
    //      src: 'test/folder/module.js'    -> ../folder/module.js
    //      src: 'folder/folder/module.js'  -> ../../folder/folder/module.js

    var pkg_error = check_package(pkg);
    if(pkg_error){
        return callback(pkg_error);
    }

    var name = pkg.name;
    var version = pkg.version;

    // if options.dist exists, skip building
    if(options.dist){
        built_folder = options.dist;
        callback(null, {
            folder: built_folder
        });

    }else{
        // ROOT/test/fixtures/build/index.js
        var built_folder = node_path.join(cwd, CORTEX_BUILT_TEMP);
        var output = node_path.join(built_folder, name + '.js');

        if(!fs.exists(built_folder)){
            fs.mkdir(built_folder);
        }
        fs.delete(output);

        // -> 'module@0.0.1'
        var main_id = name + '@' + version;

        // /User/.../xxx/index.js
        var main_file = node_path.join(
            cwd, 
            // default to `'index.js'`
            ensure_js_ext(pkg.main || 'index.js') 
        );

        if( !fs.exists(main_file) ){
            return callback(MESSAGE.NO_PACKAGE_MAIN);
        }

        var main_dir = node_path.dirname(main_file);

        async.waterfall([
            function(done) {
                // check file paths
                build.check_files({
                    main_dir: main_dir,
                    files: options.files

                }, done);
            },

            function(data, done) {
                async.parallel(
                    // build each file
                    data.files.map(function(file) {
                        return function(sub_done) {
                            logger.info('{{cyan Parsing}}', file, '...');

                            var id = build.generate_identifier({
                                file: file,
                                main_dir: main_dir,
                                main_file: main_file,
                                main_id: main_id
                            });

                            build.write_module({
                                dependencies: lang.object_member_by_namespaces(
                                    pkg, 'cortex.exactDependencies', {}
                                ),
                                file: file,
                                define: options.define,
                                id: id,
                                output: output

                            }, sub_done);
                        } 
                    }),
                    done
                );
            }

        ], function(err) {
            if(err){
                callback(err);
            }else{
                callback(null, {
                    folder: built_folder,
                    name: name,
                    version: version
                });
            }
        });
    }
};


// check the file paths
// - main_dir: {string} 
// - files: {Array}
build.check_files = function(options, callback) {
    var filtered = options.files.filter(function(file) {
        if( fs.exists(file) ){
            return true;
        }else{
            logger.warn( logger.template(MESSAGE.FILE_NOT_FOUND, {path: file}) );
            return false;
        }
    });

    var passed = filtered.every(function(file) {

        // the relative path of the current module to the main module
        // main_path: 'test/fixtures/main.js',
        // path: 'ROOT/test/fixtures/folder/foo.js'
        // -> 'folder/foo.js'
        if( ~ node_path.relative(options.main_dir, file).indexOf('../') ){
            callback( logger.template(MESSAGEUSE_PARENT_DIRECTORY, {
                path: file
            }) );

        }else{
            return true;
        }
    });

    if(passed){
        callback(null, {
            files: filtered
        });
    }
};


// generate the standard identifier of the current file
// @param {Object} options
// - file: {string} the pathname of the current file
// - main_dir: {string} dirname of main_file
// - main_file: {string} absolute url of the `main` property in package.json
// - main_id: {string} the standard identifier of the main module
build.generate_identifier = function(options) {
    // the exact identifier
    var id;
    var file = options.file;

    if(file === options.main_file){
        id = options.main_id;

    }else{

        var relative_path = node_path.relative(options.main_dir, file);

        // -> 'folder/foo'
        var relative_id = relative_path.replace(REGEX_ENDS_WITH_JS, '');

        // -> 'module@0.0.1/folder/foo'
        id = node_path.join(options.main_id, relative_id);
    }

    return id;
};


// @param {Object} options
// - file: {string}
// - dependencies: {Object} exact dependencies of the current package
// - define: {string} `options.define` of `module.exports`
// - id: {string} standard id of the current module 
// - output: {string}
build.write_module = function(options, callback) {
    var file = options.file;

    // read file
    var content = fs.read(file);
    
    var ast;

    // syntax parse may cause a javascript error
    try{
        ast = uglifyjs.parse(content);
    }catch(e){
        return callback(
            logger.template(MESSAGE.SYNTAX_PARSE_ERROR, {path: file, err: e})
        );
    }

    if(!checker.check(ast)){
        logger.warn( logger.template(MESSAGE.ALREADY_WRAPPED, {path: file}) );
        wrapped = content;

    }else{
        async.waterfall([
            function(done) {
                build.parse_dependencies({
                    ast: ast,
                    file: file
                }, done);
            },

            function(data, done) {
                build.resolve_dependencies({
                    dependencies: data.dependencies,
                    pkg_dependencies: options.dependencies,
                    file: file
                }, done);
            },

            function(data, done) {
                var wrapped = wrapper({
                    define  : options.define,
                    code    : content,
                    deps    : data.dependencies,
                    id      : options.id
                });

                fs.write(options.output, wrapped + '\n\n', {
                    flag: 'a+'
                });

                done();
            }

        ], function(err) {
            callback(err);
        });
    }
}


// parse dependencies from the Abstract Syntax Tree
// @param {Object} options
// - file: {string}
// - ast: {uglifyjs.AST_Node} 
build.parse_dependencies = function(options, callback) {
    var deps = [];
    var err;

    // use syntax analytics
    var walker = new uglifyjs.TreeWalker(function(node) {
        if(!err && node.CTOR === uglifyjs.AST_Call){
            var expression = node.expression;
            var args = node.args;

            if(expression.CTOR === uglifyjs.AST_SymbolRef && expression.name === 'require'){
                var dep = args[0];

                // require('async')
                if(args.length === 1 && dep.CTOR === uglifyjs.AST_String){
                    deps.push(dep.value);
                    
                }else{
                    err = logger.template( MESSAGE.WRONG_USE_REQUIRE, {path: options.file} );
                }
            }
        }
    });

    options.ast.walk(walker);

    if(err){
        callback(err);
    }else{
        callback(null, {
            dependencies: deps
        });
    }
};


// resolve the ids of the dependencies array into standard identifers
// @param {Object} options
// - dependencies: {Array} array of dependencies of the current module
// - pkg_dependencies: {Object} 'dependencies' of package.json
// - file: {string}
// X - separator: {string} @

// @returns {string} resolved dependencies
build.resolve_dependencies = function(options, callback) {

    // suppose: 
    //      ['./a', '../../b']
    // `options.dependencies` may have relative items, validate them
    var deps = options.dependencies;

    var i = 0;
    var length = deps.length;
    var dep;
    var resolved = [];

    var err;

    for(; i < length; i ++){
        dep = deps[i];

        if(!is_relative_path(dep)){
            var version = options.pkg_dependencies[dep];

            if(!version){
                err = logger.template( MESSAGE.NO_EXACT_VERSION, {mod: dep, path: options.file} );
                break;
            }

            dep += '@' + version;
        }

        resolved.push(dep);
    }

    if(err){
        callback(err);
    }else{
        callback(null, {
            dependencies: resolved
        });
    }
};


// TODO
build.check_stable_module = function(options, callback) {
    callback(null);
};


// publish modules to local server
// @param {Object} options
// - name: {string}
// - version: {string}
// - folder: {path}
build.publish = function(options, callback) {
    logger.info('{{cyan Publishing...}}');

    var to = node_path.join( CORTEX_BUILT_ROOT, options.name, options.version );

    try{
        fs.exists(to) && fs.delete(to, {
            force: true
        });

        fs.copy(options.folder, to, {
            force: true
        });

        callback(null);

    }catch(e){
        callback(e);
    }
}
