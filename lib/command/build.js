'use strict';

var checker     = require('../util/check-wrapper');
var lang        = require('../util/lang');
var wrapper     = require('../util/wrapper');

var uglifyjs    = require('uglify-js');
var node_path   = require('path');
var fs          = require('fs-sync');
var profile     = require('cortex-profile');

var CORTEX_ROOT = profile.option('cortex_root');
var CORTEX_BUILT_ROOT = profile.option('built_root');

var ERROR_MESSAGE = {
    USE_PARENT_DIRECTORY: 'Modules "{mod}" outside the folder of main entrance may cause serious further problems.',
    NO_VERSION: 'Exact version of dependency "{mod}" has not defined in package.json. Use "ctx install {mod} --save"',
    SYNTAX_PARSE_ERROR:  'Source file "{path}" syntax parse error: "{err}"',
    NOT_FOUND: 'Source file "{path}" not found',
    ALREADY_WRAPPED: 'Source file "{path}" already has module wrapping, which will cause further problems',
    WRONG_USE_REQUIRE: 'Source file "{path}": `require` should have one and only one string as an argument',
    NO_PACKAGE_MAIN: 'Property "main" not found in package.json'
};

var REGEX_ENDS_WITH_JS = /\.js$/;

var ENSURE_PROPERTY = {
    name: {
        err: 'package.name must be defined'
    },

    version: {
        err: 'package.version must be defined'
    }
};

function check_package(pkg, on_error){
    var pass = true;

    Object.keys(ENSURE_PROPERTY).forEach(function(key, config) {
        if(!pkg[key]){
            pass = false;
            on_error(config.err);
        }

    });

    return pass;
}


function is_relative_path(str){
    return str.indexOf('../') === 0 || str.indexOf('./') === 0;
}

function fail(template, obj){
    process.stdout.write(lang.template(template, obj) + '\n');
    process.exit(1);
}

function warn(template, obj){
    process.stdout.write('Warn: ' + lang.template(template, obj) + '\n');
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
module.exports = function(options, callback) {
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

    if(
        !check_package(pkg, function(err) {
            callback('Package.json: ' + err);
        })
    ){
        return;
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
                warn(ERROR_MESSAGE.NO_PACKAGE_MAIN);
                warn('Fallback to CWD/index.js.')
                pkg_main = node_path.join(cwd, 'index.js');

            }else{
                fail(ERROR_MESSAGE.NO_PACKAGE_MAIN);
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
            var id;
            var relative_path;
            var relative_id;
            var relative_id_dir;

            if(file_path === pkg_main){
                id = main_id;
                relative_id_dir = './';
            
            }else{

                // file_path: 'ROOT/test/fixtures/folder/foo.js'
                // -> 'folder/foo.js'
                relative_path = node_path.relative(pkg_main_dir, file_path);

                if(relative_path.indexOf('../') === 0){
                    fail(ERROR_MESSAGE.USE_PARENT_DIRECTORY, {mod: file_path});
                    return;
                }

                // -> 'folder/foo'
                relative_id = relative_path.replace(REGEX_ENDS_WITH_JS, '');

                // -> 'folder'
                relative_id_dir = node_path.dirname(relative_id);

                // -> 'module@0.0.1/folder/foo'
                id = node_path.join(main_id_dir, relative_id);
            }

            // Warn on and remove invalid source files (if nonull was set).
            if (!fs.exists(file_path)) {
                warn(ERROR_MESSAGE.NOT_FOUND, {path: file_path});
                return;
            }

            // read file
            var content = fs.read(file_path);
            var ast;

            // syntax parse may cause a javascript error
            try{
                ast = uglifyjs.parse(content);
            }catch(e){
                fail(ERROR_MESSAGE.SYNTAX_PARSE_ERROR, {path: file_path, err: e.toString()});
                return;
            }

            if(!checker.check(ast)){
                warn(ERROR_MESSAGE.ALREADY_WRAPPED, {path: file_path});
                return;
            }

            var deps = [];

            // use syntax analytics
            var walker = new uglifyjs.TreeWalker(function(node) {

                if(node.CTOR === uglifyjs.AST_Call){
                    var expression = node.expression;
                    var args = node.args;

                    if(expression.CTOR === uglifyjs.AST_SymbolRef && expression.name === 'require'){
                        var dep = args[0];

                        if(args.length === 1 && dep.CTOR === uglifyjs.AST_String){
                            
                            deps.push(dep.value);
                            
                        }else{
                            fail(ERROR_MESSAGE.WRONG_USE_REQUIRE, {path: file_path});
                        }
                    }
                }
            });

            ast.walk(walker);

            // suppose: 
            //      ['./a', '../../b']
            // `deps` may have relative items, normalize them
            deps = deps.map(function(dep){
                
                if(is_relative_path(dep)){

                    // ./a -> folder/a
                    // ../../b -> ../b
                    var relative_dep_id = node_path.normalize( node_path.join(relative_id_dir, dep) );

                    if(relative_dep_id.indexOf('../') === 0){
                        fail(ERROR_MESSAGE.USE_PARENT_DIRECTORY, {mod: dep})
                    }

                    // -> module@0.0.1/folder/a
                    // maintain './a' if relative dependency
                    // dep

                }else{
                    var version = dependencies[dep];

                    // TODO: 
                    // check if absolute version
                    if(!version){
                        fail(ERROR_MESSAGE.NO_VERSION, {mod: dep, path: file_path});
                    }

                    dep += separator + version;
                }

                return dep;
            });

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
                process.stdout.write('Append wrapped "' + file_path + '" to file "' + dest + '".\n');
            }
        });
    
    }// end if options.dist 

    if(options.publish){
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

                process.stdout.write('Copying directory "' + local_built_folder + '/".\n');

                fs.copy(local_built_folder, global_built_folder, {
                    force: true
                });
                
            }else{
                warn('There\'s already stable built "' + name + '@' + version + '" found');
            }
        
        }else{
            warn('Build folder not found, skip building "' + name + '@' + version + '"');
        }
    }

    process.stdout.write('Success!\n');

    callback && callback();
};
