'use strict';

var lang = exports;

/**
 * @param {string} template template string
 * @param {Object} params
 */
lang.template = function(template, params) {

  // suppose:
  // template = 'abc{a}\\{b}';
  // params = { a: 1, b: 2 };

  if (!params) {
    params = {};
  }

  // returns: 'abc1{b}'
  return ('' + template).replace(/\\?\{([^{}]+)\}/g, function(match, name) { // name -> match group 1

    // never substitute escaped braces `\\{}`
    // '\\{b}' -> '{b}'
    return match.charAt(0) === '\\' ? match.slice(1) :
    // '{a}' -> '1'
    (params[name] != null ? params[name] : '');
  });
};


lang.makeArray = function(subject) {
  if (Array.isArray(subject)) {
    return subject;

  } else if (subject === undefined || subject === null) {
    return [];

  } else {
    return [subject];
  }
};


lang.isEmptyObject = function(obj) {
  var key;

  for (key in obj) {
    return false;
  }

  return true;
};


lang.each = function(obj, callback) {
  var key;

  if (obj) {
    for (key in obj) {
      callback(obj[key], key);
    }
  }
};


/**
 * copy all properties in the supplier to the receiver
 * @param r {Object} receiver
 * @param s {Object} supplier
 * @param or {boolean=} whether override the existing property in the receiver
 * @param cl {(Array.<string>)=} copy list, an array of selected properties
 */
lang.mix = function(r, s, or, cl) {
  if (!s || !r) {
    return r;
  }

  var i = 0,
    c, len;

  or = or || or === undefined;

  if (cl && (len = cl.length)) {
    for (; i < len; i++) {
      c = cl[i];
      if ((c in s) && (or || !(c in r))) {
        r[c] = s[c];
      }
    }
  } else {
    for (c in s) {
      if (or || !(c in r)) {
        r[c] = s[c];
      }
    }
  }
  return r;
};


// var obj = {a: {b: 2 }}
// obj, 'a.b' -> 2
lang.object_member_by_namespaces = function(obj, namespaces, default_value) {
  var splitted = namespaces.split('.');
  var value = obj;

  splitted.some(function(ns) {
    if (ns in value) {
      value = value[ns];
    } else {
      value = null;
      return true;
    }
  });

  return value || default_value;
};


lang.push_unique = function(array, items) {
  items = lang.makeArray(items);

  items.forEach(function(item) {
    if (!~array.indexOf(item)) {
      array.push(item);
    }
  });
};