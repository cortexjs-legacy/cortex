/**
 * Parser: deps
 * parse the dependencies of a neuron module
 
 * @require uglify-js [github](https://github.com/mishoo/UglifyJS)
 */

/**
 
 parse content
 ->
 parse deps in comment
 ->
 remove comment
 ->
 parse deps in codes
 
 
 
 */

var

/**
 /
    [^.]                    // can't start with `.`, require should not be an object method

    \brequire               // require is the first letter
    // \s*                     // whitespaces which allowed by JavaScript grammar
    \(                
        // \s*                 // whitespaces which allowed by JavaScript grammar
        (["'])              // `"` or `'`
        
        ([a-zA-Z0-9-\/.~]+)  // alphabets, 
                            // numbers, 
                            // `-` (dash), ex: 'my-mod'
                            // `/` (slash), ex: 'io/ajax'
                            // `.` (dot), allowed by neuron, ex: './mymod'
                            // `~`, for app home, ex: '~/index'
                            
        \1                  // matched `"` or `'`
        // \s*                 // whitespaces which allowed by JavaScript grammar
    \)                
 /g

 match:
 require('io/ajax')
 
 ignore:
 .require('io/ajax')

*/
REGEX_EXECUTOR_REQUIRE = /[^.]\brequire\((["'])([a-zA-Z0-9-\/.~]+)\1\)/g,

/**
 * Something about CRLF (`\r`, carrage return & `\n`, line feed)
 * in Windows, a line ends with a '\r\n', but only a '\n' in Linux.
 * so, I use:
     /(?:^|\n)/ to match the beginning of a new line(or the beginning of the document string)
     /(?:\r|\n|$)/ to match the end of a line(or the end of the document string)
     
 /
    (?:^|\n)                // new line
    [\s\/*]*                // a really simple pattern to match `//`, `/*`, `/**` or just whitespace(s)
    @require
    \s+                     // must be at least one whitespace after `@require`
    ([a-zA-Z0-9-\/.~]+)
    \s*
    (?:\r|\n|$)             // line end
 /
 
 */
REGEX_EXECUTOR_COMMENT_REQUIRE = /(?:^|\n)[\s\/*]*@require\s+([a-zA-Z0-9-\/.~]+)\s*(?:\r|\n|$)/g,

/**
 * .provide('io/ajax'
 */
REGEX_EXECUTOR_NR_PROVIDE_ONE = /\.provide\((["'])([a-zA-Z0-9-\/.~]+)\1/g,

/**
 
 /
    \.provide               // must use .provide
    // \s*                     // allowed whitespaces
    \(
        // \s*                 // allowed whitespaces or line wraps
        \[
            ([a-zA-Z0-9-\/,"'.~]+)  // no whitespaces
        \]
 /g
 
 

 * match:
 * .provide(['io/ajax', 'io/jsonp']         // normal
 * .provide([ 'io/ajax', "io/jsonp" ]       // with more whitespaces
 * .provide([                               // with line wraps
        'io/ajax',
        'io/jsonp'
    ], 
 */
REGEX_EXECUTOR_NR_PROVIDE_MORE = /\.provide\(\[([a-zA-Z0-9-\/,"'.~]+)\],/g,

/**
 * "abc", 'def', 'ddd" -> ['abc', 'def']
 */
REGEX_EXECUTOR_ARRAY_STRING = /(["'])([a-zA-Z0-9-\/.~]+)\1/g,

pushUnique = require('../util/push-unique'),

uglify_js = require('uglify-js'),
parser = uglify_js.parser,
generator = uglify_js.uglify;


/**
 * @returns {Array.<string>} an array contains all dependencies
 */
function parseAllDeps(content){
    var deps = [],
    
        // ast parser could not accept a file buffer returned by fs.readFileSync
        // should convert to string first
        ast = parser.parse(content.toString()),
        
        // re-generate code
        compressed = generator.gen_code(ast);
       
    // parse `@require dep` 
    executor(content, REGEX_EXECUTOR_COMMENT_REQUIRE, 1, deps);
    
    // parse `require()`
    executor(compressed, REGEX_EXECUTOR_REQUIRE, 2, deps);
    
    // parse `.provide('dep')`
    executor(compressed, REGEX_EXECUTOR_NR_PROVIDE_ONE, 2, deps);
    
    // parse `.provide(['dep', 'dep2'])`
    executor(compressed, REGEX_EXECUTOR_NR_PROVIDE_MORE, function(m){
        return executor(m[1], REGEX_EXECUTOR_ARRAY_STRING, 2, []);
    }, deps);
    
    return deps;
};


/**
 * @param {string} content
 * @param {RegExp} regex
 * @param {number|function(){}} fn
    {number} push the match result at the specified index
    {function()} push the return value of the function
 * @param {Array} append
 */
function executor(content, regex, fn, append){
    var m;
    
    if(typeof fn === 'number'){
        while(m = regex.exec(content)){
            pushUnique(append, m[fn]);
        }
        
    }else if(typeof fn === 'function'){
        while(m = regex.exec(content)){
            pushUnique(append, fn(m));
        }
    }
    
    return append;
};


module.exports = function(content){
    return {
    
        // Kael(2012-08-11):
        // the reason why not returns the dependencies directly 
        // is that Cortex will treat dynamic deps and static deps differently in the near future
        deps: parseAllDeps(content)
    }
};


/**
 
 change log:
 
 2012-08-13 Kael:
 - TODO[08-11].A
 
 2012-08-11 Kael:
 - complete main functionalities
 
 TODO:
 A. use uglifyJS to do AST parsing, removing all JavaScript annotations before parsing dependencies
 B. try something to solve the problem parsing some sort of dynamic deps
 
 */

