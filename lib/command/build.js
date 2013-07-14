'use strict';

module.exports = build;

var checker     = require('../util/check-wrapper');
var lang        = require('../util/lang');
var wrapper     = require('../util/wrapper');

var i18n        = require('../i18n');
var MESSAGE     = i18n.require('command-build');

var uglifyjs    = require('uglify-js');
var fs          = require('fs-sync');
var profile     = require('cortex-profile');
var async       = require('async');

var node_path   = require('path');

var CORTEX_ROOT         = profile.option('cortex_root');
var CORTEX_BUILT_ROOT   = profile.option('built_root');

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

// with no fault tolerance with arguments
// no arguments overloading

// @param {Object} options
// - cwd: {node_path} absolute dir
// - separator: {string}
// - define: {string}
// - output: {node_path} the path of the ouput file, ending with '.js'
// - dist: {node_path} 
// - files: {Array.<string>} array of absolute file paths to be built all of which will be built into options.output
function build(options, callback) {
    var local_built_folder;
    var cwd = options.cwd;
    var pkg = fs.readJSON( node_path.join(options.cwd, 'package.json') );
    var separator = options.separator;
    
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
        local_built_folder = options.dist;

    }else{
        // ROOT/test/fixtures/build/index.js
        var dest = options.output;

        // rebuild
        fs.delete(dest);

        local_built_folder = node_path.dirname(dest);

        var files = options.files;
        var dependencies = pkg.cortexExactDependencies || {};

        // -> 'module@0.0.1'
        var main_id = name + separator + version;

        // -> 'module@0.0.1/'
        var main_id_dir = main_id;

        var pkg_main;

        if( !pkg.main ){
            if( fs.exists(cwd, 'index.js')  ){
                logger.warn(MESSAGE.NO_PACKAGE_MAIN);
                pkg_main = node_path.join(cwd, 'index.js');

            }else{
                return callback(MESSAGE.NO_PACKAGE_MAIN);
            }

        }else{
            // absolute pkg.main path
            pkg_main = node_path.join(cwd, pkg.main);
        }



        
        var pkg_main_dir = node_path.dirname(pkg_main);

        if(!REGEX_ENDS_WITH_JS.test(pkg_main)){
            pkg_main += '.js';
        }

        // Iterate over all specified file groups.
        files.forEach(function(file_path) {
            
        });
    
    }// end if options.dist 



    callback && callback();
};


build.prepare_data = function(options, callback) {
    
}


// generate the standard identifier of the current file
// @param {Object} options
// - file: {string} the pathname of the current file
// - main_file: {string} absolute url of the `main` property in package.json
// - main_dir: {string} dirname of main_file
// - main_id: {string} the standard identifier of the main module
build.generate_identifier = function(options, callback) {
    // the exact identifier
    var id;
    var file = options.file;

    // the relative dirname of the current module to the main module
    var relative_dir;

    if(file === options.main_file){
        id = options.main_id;
        relative_dir = '.';

    }else{
        var main_dir = options.main_dir;

        // the relative path of the current module to the main module
        // main_path: 'test/fixtures/main.js',
        // path: 'ROOT/test/fixtures/folder/foo.js'
        // -> 'folder/foo.js'
        var relative_path = node_path.relative(main_dir, file);

        if(relative_path.indexOf('../') === 0){
            return callback( logger.template(MESSAGE.USE_PARENT_DIRECTORY, {mod: file}) );
        }

        // -> 'folder/foo'
        var relative_id = relative_path.replace(REGEX_ENDS_WITH_JS, '');

        // -> 'folder'
        relative_dir = node_path.dirname(relative_id);

        // -> 'module@0.0.1/folder/foo'
        id = node_path.join(main_dir, relative_id);
    }

    callback(null, {
        id: id,
        relative_dir: relative_dir
    });
};


build.write_module = function(options, callback) {
    // Warn on and remove invalid source files (if nonull was set).
    if (!fs.exists(file_path)) {
        logger.warn(MESSAGE.NOT_FOUND, {path: file_path});
        return;
    }

    // read file
    var content = fs.read(file_path);
    
    var ast;

    // syntax parse may cause a javascript error
    try{
        ast = uglifyjs.parse(content);
    }catch(e){
        fail(MESSAGE.SYNTAX_PARSE_ERROR, {path: file_path, err: e.toString()});
        return;
    }

    if(!checker.check(ast)){
        logger.warn(MESSAGE.ALREADY_WRAPPED, {path: file_path});
        return;
    }
    

    var wrapped = wrapper({
        define  : options.define,
        code    : content,
        deps    : deps,
        id      : id
    });

    

    if(wrapped){
        var dir = node_path.dirname(dest);

        if(!fs.exists(dir)){
            fs.mkdir(dir);
        }

        fs.write(dest, wrapped + '\n\n', {
            flag: 'a+'
        });

        // Print a success message.
        // process.stdout.write('Append wrapped "' + file_path + '" to file "' + dest + '".\n');
    }
}


// parse dependencies from the Abstract Syntax Tree
// @param {uglifyjs.AST_Node} ast
build.parse_dependencies = function(ast, callback) {
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
                    err = logger.template( MESSAGE.WRONG_USE_REQUIRE, {path: file_path} );
                }
            }
        }
    });

    ast.walk(walker);

    if(err){
        callback(err);
    }else{
        callback(null, {
            deps: deps
        });
    }
};


// resolve the ids of the dependencies array into standard identifers
// @param {Object} options
// - dependencies: {Array} array of dependencies of the current module
// - pkg_dependencies: {Object} 'dependencies' of package.json
// - relative_dir: {string} the standard id of the current module. `options.relative_dir` is only used for checking
// - separator: {string} @

// @returns {string} resolved dependencies
build.resolve_dependencies = function(options, callback) {
    var relative_dir = options.relative_dir;

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

        if(is_relative_path(dep)){

            // ./a -> folder/a
            // ../../b -> ../b
            var relative_dep_id = node_path.normalize( node_path.join(relative_dir, dep) );

            // it will cause serious problem if we depend on the modules outside the directory of the main module
            if(relative_dep_id.indexOf('../') === 0){
                err = logger.template(MESSAGE.USE_PARENT_DIRECTORY, {mod: dep}) );
                break;

            } // else{
                // -> module@0.0.1/folder/a
                // maintain './a' if relative dependency
            // }

            // we only check relative modules but not change them
            resolved[i] = dep;

        // foreign modules
        }else{
            var version = dependencies[dep];

            if(!version){
                err = logger.template( MESSAGE.NO_VERSION, {mod: dep, path: file_path} );
                break
            }

            dep += options.separator + version;
        }
    }

    if(err){
        callback(err);
    }else{
        callback(null, {
            dependencies: resolved
        });
    }
};


// publish modules to local server
// @param {Object} options
build.publish = function(options, callback) {
    // build move
    var stable_modules = fs.readJSON( node_path.join(CORTEX_ROOT, 'stable_modules') );
    var stable_versions = stable_modules[name] || [];

    // TODO:
    // checking global .cortex folder
    var global_built_folder = node_path.join(CORTEX_BUILT_ROOT, name, version);

    var global_built_folder_exists;

    if(fs.exists(local_built_folder)){

        if( 
            // if already built
            !(global_built_folder_exists = fs.exists( global_built_folder )) ||

            // never replace stable build folders
            stable_versions.indexOf(version) === -1
        ){
            global_built_folder_exists && fs.delete(global_built_folder, {
                force: true
            });

            // process.stdout.write('Copying directory "' + local_built_folder + '/".\n');

            fs.copy(local_built_folder, global_built_folder, {
                force: true
            });
            
        }else{
            // logger.warn('There\'s already stable built "' + name + '@' + version + '" found');
        }
    
    }else{
        // logger.warn('Build folder not found, skip building "' + name + '@' + version + '"');
    }
}
