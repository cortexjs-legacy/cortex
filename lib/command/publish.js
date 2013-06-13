'use strict';

var node_path    = require('path');
var node_fs        = require('fs');
var node_url     = require('url');

var request        = require('request');
var async        = require('async');
var profile     = require('cortex-profile');
var fs             = require('fs-sync');
var targz         = require('tar.gz');

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
        parsed = JSON.parse(body);
    }else{
        return err('invalid response body');
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

    // @param {Object} opts
    // - pkg {Object} package json data
    // - tar {node_path} tar file
    // - snapshot {boolean}
    publish.prepare(options, function(opts) {
        var registry = options.registry;
        var force = options.force;
        var pkg = opts.pkg;

        var data = {
            _id: pkg.name,
            name: pkg.name,
            description: pkg.description,
            "dist-tags": {},
            versions: {},
            readme: data.readme || "",
            maintainers: [
                {
                    name: username,
                    email: email
                }
            ]
        };

        var 

        var tbName = data.name + "-" + data.version + ".tgz";
        var tbURI = data.name + "/-/" + tbName;

        data._id = data.name + "@" + data.version
        data.dist = data.dist || {}
        data.dist.tarball = url.resolve(registry, tbURI)
            .replace(/^https:\/\//, "http://")



        async.waterfall([

            // check if 
            function(done) {
                request({
                    method: 'PUT',
                    url: 

                }, function(err, res, body) {
                    
                })
            },

            function(done) {
                request({
                    url: node_url.resolve(registry, pkg.name),
                    method: 'GET'
                }, function(err, res, body) {
                    if(err){
                        return done(err);
                    }

                    var parsed = parse_json(body, done);

                    done(null, parsed);
                });
            },

            function(parsed, done) {
                
            }


        ], function(err) {
            callback && callback(err); 
        });
    });
};


// santitize arguments
// prepare tar file and json data
publish.prepare = function(options, callback) {
    var file = options.tar;
    file = '/Users/Kael/.npm/neuronjs/2.0.1/package.tgz';
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

