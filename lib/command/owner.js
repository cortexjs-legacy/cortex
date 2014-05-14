'use strict';

var owner     = exports;
var node_url  = require('url');


// @param {Object} options
// - pkg: {string} package name
// - user
// - action
owner.run = function(options, callback) {
  this[options.action](options, callback);
};


// - pkg
// - user
owner.add = function(options, callback) {
  var self = this;

  self._get_user(options.user, function(err, res, json) {
    if (err) {
      return callback(err, res, json);
    }

    var user = json;
    var pkgname = options.pkg;

    self._get_pkg(pkgname, function(err, res, json) {
      if (err) {
        return callback(err, res, json);
      }

      var pkg = json;
      var maintainers = pkg.maintainers;
      var username = user.name;
      var email = user.email;

      if (
        maintainers.some(function(maintainer) {
          return maintainer.name === username;
        })
      ) {
        return callback({
          code: 'EOWNEREXISTS',
          message: 'user "' + username + '" is already the owner of the package "' + pkgname + '".',
          data: {
            username: username,
            email: email,
            pkg: pkgname
          }
        });
      }

      maintainers.push({
        name: username,
        email: email
      });

      self.logger.debug('maintainers', maintainers);

      self._put_pkg(pkgname, {
        _id: pkg._id,
        _rev: pkg._rev,
        maintainers: maintainers

      }, callback);
    })
  });
};


// - pkg
// - user
owner.rm = function(options, callback) {
  var self = this;
  var pkgname = options.pkg;

  self._get_pkg(pkgname, function(err, res, json) {
    if (err) {
      return callback(err, res, json);
    }

    var pkg = json;
    var maintainers = pkg.maintainers;
    var username = options.user;
    var found;

    var filtered_maintainers = maintainers.filter(function(maintainer) {
      var match = maintainer.name === username;

      if (match) {
        found = true;
      }

      return !match;
    });

    if (!found) {
      return callback({
        code: 'ENOTOWNER',
        message: 'user "' + username + '" is not one of the owners of the package "' + pkgname + '".',
        data: {
          username: username,
          pkg: pkgname
        }
      }, res, json);
    }

    if (!filtered_maintainers.length) {
      return callback({
        code: 'EREMOVEALL',
        message: 'cannot remove all owners of a package. add someone else first.',
        data: {
          username: username,
          owners: maintainers,
          pkg: pkgname
        }

      }, res, json);
    }

    self._put_pkg(pkgname, {
      _id: pkg._id,
      _rev: pkg._rev,
      maintainers: filtered_maintainers

    }, callback);
  });
};


// - pkg
owner.ls = function(options, callback) {
  var self = this;
  var pkgname = options.pkg;

  self._get_pkg(pkgname, function(err, res, json) {
    if (err) {
      return callback(err, res, json);
    }

    var pkg = json;
    var maintainers = pkg.maintainers;

    if (maintainers.length) {
      self.logger.info('\n{{cyan owners}} of "' + pkgname + '":');

      maintainers.forEach(function(maintainer) {
        self.logger.info('   ' + maintainer.name + ' <' + maintainer.email + '>');
      });
    }

    callback(err, res, json);
  });
};


owner._get_user = function(user, callback) {
  var self = this;

  this.neuropil.get('/-/user/org.couchdb.user:' + user, function(err, res, json) {
    if (err && res && res.statusCode === 404) {
      return callback({
        code: 'EUSERNOTFOUND',
        message: 'user "' + user + '" is not found.',
        data: {
          username: user,
          error: err
        }

      }, res, json);
    }

    callback(err, res, json);
  });
};


owner._get_pkg = function(pkg, callback) {
  this.neuropil.get(pkg, function(err, res, json) {
    if (err && res && res.statusCode === 404) {
      return callback({
        code: 'EPKGNOTFOUND',
        message: 'package "' + pkg + '" is not found.',
        data: {
          pkg: pkg
        }

      }, res, json);
    }

    callback(err, res, json);
  });
};


owner._put_pkg = function(pkg, data, callback) {
  this.neuropil.put(pkg, {
    json: data
  }, callback);
};