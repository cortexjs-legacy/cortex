"use strict";

var url = require('url');
var color = require('colors');
var columnify = require('columnify');


var search = exports;

search.run = function(options, callback) {
  var self = this;
  var registry_url = this.profile.get('registry').replace(/\/$/, '');

  if(!/:[0-9]+$/.test(registry_url)) {
    registry_url = registry_url +':' + this.profile.get('registry_port');
  }

  var search = require('cortex-search-utils')(registry_url);


  var width = getMaxWidth();
  var sort = options.sort || 'name';
  var reverse = options.reverse;
  var splitter = options.splitter || ' ';
  var terms = options.terms || [];

  search.searchByWord(terms, function(err, rows) {
    if (err) {
      return callback(new Error(err.message));
    }

    if (rows.length == 0) {
      self.logger.warn('No match found for "' + terms.join(' ') + '"');
      return callback();
    }

    rows = rows.map(function(row) {
      row.keywords = row.keywords.join(' ');
      delete row.url;
      return row;
    });

    if (!rows[0].hasOwnProperty(sort))
      sort = 'name';

    rows.sort(function(a, b) {
      var aa = a[sort].toLowerCase(),
        bb = b[sort].toLowerCase();
      return aa === bb ? 0 : aa < bb ? -1 : 1;
    });

    if (reverse) rows.reverse();

    var out = columnify(rows, {
      include: ['name', 'description', 'authors', 'latest', 'keywords'],
      truncate: width != Infinity,
      columnSplitter: splitter,
      config: {
        name: {
          maxWidth: 40,
          truncate: false,
          truncateMarker: ''
        },
        description: {
          maxWidth: 60
        },
        authors: {
          maxWidth: 20
        },
        date: {
          maxWidth: 11
        },
        version: {
          maxWidth: 11
        },
        keywords: {
          maxWidth: Infinity // last column
        }
      }
    });


    if (width != Infinity)
      out = out.split('\n').map(function(line) {
        if (line.wcwidth > width) {
          line = line.slice(0, width - line.wcwidth);
        }

        return line.slice(0, width);
      }).join('\n');

    var lines = out.split('\n');
    var header = lines[0];
    lines.splice(0, 1);
    var rems = lines.join('\n');

    terms.forEach(function(term) {
      rems = rems.replace(new RegExp(term, "gi"), function(bit) {
        return color.red(term);
      });
    });
    
    process.stdout.write([header, rems].join('\n') + '\n');
    callback(null);
  });

};


function getMaxWidth() {
  try {
    var tty = require("tty"),
    stdout = process.stdout,
    cols = !tty.isatty(stdout.fd) ? Infinity : process.stdout.columns;
    cols = (cols == 0) ? Infinity : cols;
  } catch (e) {
    cols = Infinity;
  }
  return cols;
}
