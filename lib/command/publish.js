'use strict';

var node_path	= require('path');
var node_fs     = require('fs');
var node_url    = require('url');

var request     = require('request');
var async       = require('async');
var profile     = require('cortex-profile');
var fs          = require('fs-sync');
var targz       = require('tar.gz');

var REGEX_IS_SNAPSHOT = /\-SNAPSHOT$/;

function fail(msg){
    process.stdout.write(msg + '\n');
    process.exit(1);
}

function exit(){
    process.exit(1);
}

function parse_json(json, err){
    var parsed;

    try{
        parsed = JSON.parse(json);
    }catch(e){
        return err('invalid response body, ' + e);
    }

    return parsed;
}


module.exports = publish;

// have no fault tolerance, overload and clean your parameters ahead of time
// @param {Object} options
// - cwd: {node_path}
// - force: {boolean} force to publishing
// - tar: {node_path} tar file, if not undefined, must exists
function publish(options, callback) {
    var registry = options.registry;
    var force = options.force;

    async.waterfall([
        function(done) {
            // @param {Object} opts
            // - pkg {Object} package json data
            // - tar {node_path} tar file
            // - snapshot {boolean}
            publish.prepare(options, function(data) {
                done(null, data);
            });
        },

        // check package, create a new one if not exists
        function(data, done) {
        	var pkg = data.pkg;

            data.json = {
                _id: pkg.name,
                name: pkg.name,
                description: pkg.description,
                'dist-tags': {},
                versions: {},
                readme: pkg.readme || '',
                maintainers: [
                    // {
                    //     name: username,
                    //     email: email
                    // }
                ]
            };

            data.project_url = node_url.resolve(registry, encodeURIComponent( pkg.name ));

            process.stdout.write(data.project_url + '\n');
            request({
                method: 'PUT',
                url: data.project_url,
                json: data.json
            }, function(err, res, body) {
                if (
                    err && 
                    // 409 
                    // -> Document update conflict. this is a new version of an existing package.
                    !(response && response.statusCode === 409) && 
                    !(
                        parsed && 
                        parsed.reason === "must supply latest _rev to update existing package"
                    )
                ) {
                    fail('Failed PUT response ' + (response && response.statusCode) )
                
                }

                done(null, data);
            })
        },

        // get package information
        function(data, done) {
        	process.stdout.write(data.project_url + '\n');
            request({
                method: 'GET',
                url: data.project_url
            }, function(err, res, body) {
                if(err){
                    return done(err);
                }
                var parsed = parse_json(body, done);
                done(null, data, parsed);
            });
        },

        // update tar ball
        function(data, parsed, done) {
        	var pkg = data.pkg;

        	// 'async-0.0.1.tgz'
            var tarball_name = pkg.name + '-' + pkg.version + '.tgz';

            // 'async/-/async-0.0.1.tgz'
            var tarball_path = pkg.name + '/-/' + tarball_name;

            data._id = pkg.name + '@' + pkg.version
            pkg.dist = pkg.dist || {}
            pkg.dist.tarball = node_url.resolve(registry, tarball_path);

            console.log('parsed', parsed);
        }

    ], function(err) {
        callback && callback(err); 
    });
};


// santitize arguments
// prepare tar file and json data
publish.prepare = function(options, callback) {
    var file = options.tar;
    // file = '/Users/Kael/.npm/neuronjs/2.0.1/package.tgz';
    var temp_dir = node_path.join(profile.option('temp_root'), + new Date + '');
    var temp_package = node_path.join(temp_dir, 'package');
    var cwd = options.cwd;

    async.parallel([
        function(done) {
            // if tar file specified, extract it
            if(file){
                cwd = temp_package;
                new targz().extract(file, temp_dir, function(err) {
                    if(err){
                        fail('Error extracting "' + file + '", ' + err);

                        // TODO: temp_dir cleaner
                    }
                    done();
                });
            
            }else{
                file = node_path.join(temp_dir, 'package.tgz');
                fs.copy(cwd, temp_package);
                new targz().compress(temp_dir, file, function(err) {
                    if(err){
                        fail('Error packaging "' + cwd + '" to "' + file + '", ' + err);
                    }
                    done();
                });
            }
        }

    ], function(err) {
        var package_json = node_path.join(cwd, 'package.json');
        var pkg;

        if(fs.exists(package_json)){
            try{
                pkg = fs.readJSON(package_json);
            }catch(e){
                fail('Fail to parsing package.json. ' + e);
            }

            callback({
                tar: file,
                pkg: pkg,
                snapshot: REGEX_IS_SNAPSHOT.test(pkg.version)
            });

        }else{
            fail('No package.json file found.');
        }
    });
};


publish.upload = function(rev) {
    var file = '/Users/Kael/.npm/neuronjs/2.0.1/package.tgz';

    var stream = node_fs.createReadStream(file);

    var opts = {
        url: 'http://registry.npm.lc/neuronjs/-/neuronjs-2.0.1.tgz/-rev/' + rev,
        method: 'PUT',
        strictSSL: true,
        headers: {
            cookie: 'AuthSession=a2FlbDo1MUI4Q0Y4RjrHquYFIyhtlPIN91l7M7WRsxUdPA',
            accept: 'application/json',
            'user-agent': 'node/v0.10.10 darwin x64',
            'content-type': 'application/octet-stream',
            'content-length': 116157
        },
        proxy: null
    }

    var req = request(opts, function(err, response, body) {
        console.log(err, 'done', body);
    });

    req.on('error', function(err) {
        console.log('err', err);
    });

    stream.pipe(req);
};

