var fs          = require('fs');
var node_path   = require('path');
var semver      = require('semver-extra');
var async       = require('async');
var tar         = require('tar');
var node_zlib   = require('zlib');
var request     = require('request');
var mkdirp      = require('mkdirp');

module.exports = {
    getLoader: function(self, options, callback) {
        var file = node_path.join(options.cwd, 'cortex.config.js');
        // If cortex.config.js exists, prepare for building loaders.
        fs.exists(file, function(exists) {
            options.build_config = exists ? require(file) : {};
            var loaders = options.build_config.loaders;
            if (loaders) {
                var package_json = node_path.join(options.cwd, 'package.json');
                fs.readFile(package_json, 'UTF-8', function(err, data) {
                    if (err) {
                        callback(err);
                    }
                    var loader_skip = ['commonjs-loader', 'json-loader'];
                    var profile_root = self.profile.get('profile_root');
                    var pkgDependencies = JSON.parse(data).dependencies;
                    options.loader_version = {}; // record loaders version for using

                    loaders.map(function(loaderCfg) {
                        var loadersArr = loaderCfg.loader.split('!');
                        for (var i = 0; i < loadersArr.length; i++) {
                            if (loader_skip.indexOf(loadersArr[i]) < 0) {
                                var loader_name = loadersArr[i];
                                var cache_package_json = node_path.join(profile_root, 'loaders', loader_name, 'cache.json');
                                var package_version = pkgDependencies[loader_name];
                                loader_skip.push(loader_name);

                                async.waterfall([
                                    function getLoaderFromCache(cb) {
                                        var cache_version;
                                        if (fs.existsSync(cache_package_json)) {
                                            var result = fs.readFileSync(cache_package_json, 'UTF-8');
                                            cache_version = JSON.parse(result).version;
                                        } else {
                                            cache_version = [];
                                        }
                                        var dist_version = semver.maxSatisfying(cache_version, package_version);
                                        if (!dist_version) {
                                            cb(null, dist_version);
                                        } else {
                                            options.loader_version[loader_name] = node_path.join(profile_root, 'loaders', loader_name, dist_version, 'package');
                                            callback(null);
                                        }
                                    },
                                    function downloadLoader(dist_version, cb) {
                                        var registry_url = options.build_config.registry + loader_name;
                                        request(registry_url, function(error, response, body) {
                                            if (!error && response.statusCode == 200) {
                                                cb(null, dist_version, JSON.parse(body).versions);
                                            } else {
                                                cb(new Error('Can not find the module ' + loader_name + ' in your npm registry.'));
                                            }
                                        });
                                    },
                                    function cacheLoader(dist_version, registry_versions, cb) {
                                        dist_version = semver.maxSatisfying(Object.keys(registry_versions), package_version);
                                        options.loader_version[loader_name] = node_path.join(profile_root, 'loaders', loader_name, dist_version, 'package');
                                        //write cache.json
                                        var cache_json_file = {
                                            'version': []
                                        };
                                        cache_json_file.version.push(dist_version);
                                        mkdirp.sync(node_path.join(profile_root, 'loaders', loader_name));
                                        fs.writeFileSync(cache_package_json, JSON.stringify(cache_json_file));

                                        cb(null, registry_versions, dist_version);
                                    },
                                    function extractLoader(registry_versions, dist_version, cb) {
                                        var reqUrl = registry_versions[dist_version].dist.tarball;
                                        var pkg_root_path = node_path.join(profile_root, 'loaders', loader_name, dist_version);
                                        var extractor = tar.Extract({
                                                path: pkg_root_path
                                            })
                                            .on('end', function() {
                                                var exec = require('child_process').exec,
                                                    child;
                                                var opts = {
                                                    'cwd': node_path.join(pkg_root_path, 'package')
                                                };
                                                child = exec('npm install', opts,
                                                    function(error, stdout, stderr) {
                                                        console.log(stdout);
                                                        if (error !== null) {
                                                            callback(error);
                                                        }
                                                        callback(null);
                                                    });
                                            });

                                        request(reqUrl)
                                            .pipe(node_zlib.Unzip())
                                            .pipe(extractor);
                                    }
                                ], function(err, result) {
                                    if (err) {
                                        callback(err);
                                    }
                                });
                            }
                        }
                    });
                });
            } else {
                callback(null);
            }
        });
    }
};
