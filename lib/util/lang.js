'use strict';

var lang = exports;


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
