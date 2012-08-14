//////////////////////////////////////////////////////////////////////////////////////////////////
// Dependencies in Comments
// deps: ['io/ajax', 'io/swiff', 'util/json']
//////////////////////////////////////////////////////////////////////////////////////////////////
/**
   // correct:
 * @require io/ajax
 
   // wrong:
 * @require: io/jsonp, abc
 
   // unexpected whitespace between @ and require
 * @ require io/jsonp
 
   // must with line wrap
 * @require io/jsonp @require abc
 */

// correct
// @require io/swiff

// can have more than on whitespace
// @require      util/json


//////////////////////////////////////////////////////////////////////////////////////////////////
// Dependencies in normal code
// deps: ['b', 'c', 'mod/a', 'mod/b']
//////////////////////////////////////////////////////////////////////////////////////////////////

// code of a mess, including wired whitespace, line-wraps
NR.define(


function(K, require){
    
                // correct
    			require(             './b');
    			
    			// wrong
    			require(',a');
    
    NR.provide('c',function(K,C)



{
    }
);
    
            NR.provide(      [
'mod/a'
    
                    , "./mod/b"], function(){});

});