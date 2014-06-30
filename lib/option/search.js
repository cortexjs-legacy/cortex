'use strict';

exports.shorthands = {
  r: 'reverse'
};


exports.options = {
  sort: {
    enumerable: false,
    type: String,
    info: "the results will be sorted by this field, default is 'name'"
  },
  reverse: {
    enumerable: false,
    type: Boolean,
    info: 'whehter sorted in reverse order'
  },
  terms: {
    enumerable: false,
    type: String,
    // command line type: String
    // programmatical type: Array.<string>
    info: 'the package to be unpublished.',
    setter: function(terms) {
      var done = this.async();
      if (terms) {
        terms = terms.split(',');
      } else {
        terms = [];
      }

      var remains = this.get('_');
      if (remains.length)
        terms = terms.concat(remains);

      if (!terms.length) {
        return done("No terms provided");
      }

      done(null, terms);
    }
  }
};


exports.info = 'Search for packages from registry';

exports.usage = [
  '{{name}} search [search term ...]'
];