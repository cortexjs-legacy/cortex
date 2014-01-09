'use strict';

var helper = require('../../../lib/util/package');
var tmp = require('../../lib/tmp');

var expect = require('chai').expect;
var fs = require('fs-sync');

var node_path = require('path');

var root = node_path.resolve('test', 'playground', 'tmp');
var fixtures = node_path.resolve('test', 'fixtures');

var only_package    = make(['package.json']);
var hybrid          = make(['package.json', 'cortex.json']);
var non_existing    = make([]);


function make (files) {
    var dir = tmp.make(root);

    files.forEach(function (file) {
        copy(file, fixtures, dir);
    });

    return dir;
}

function copy (file, from, to) {
    fs.copy( node_path.join(from, file), node_path.join(to, file), {
        force: true
    });
}


describe("helper.get_package_file(cwd)", function(){
    it("helper.is_cortex_json", function(){
        expect(helper.is_cortex_json( '/xxx/xxx/xx/cortex.json' )).to.equal(true);
        expect(helper.is_cortex_json( '/xxx/xxx/xx/package.json' )).to.equal(false);
    });

    it("returns package.json if cortex.json is not existed", function(done){
        helper.get_package_file(only_package, function (err, file) {
            expect(err).to.equal(null);
            expect( helper.is_cortex_json(file) ).to.equal(false);
            
            done();
        });
    });

    it("returns cortex.json if existed", function(done){
        helper.get_package_file(hybrid, function (err, file) {
            expect(err).to.equal(null);
            expect(helper.is_cortex_json(file)).to.equal(true);
            done();
        });
    });

    it("throws error if neither is existed, strict=true", function(done){
        helper.get_package_file(non_existing, function (err, file) {
            expect(err).not.to.equal(null);
            done();
        }, true);
    });

    it("won't throw error if neither is existed, strict=", function(done){
        helper.get_package_file(non_existing, function (err, file) {
            expect(err).to.equal(null);
            done();
        });
    });
});


describe("helper.get_original_package(cwd)", function(){
    it("merges normal fields", function(done){
        helper.get_original_package(only_package, function (err, helper) {
            expect(helper.name).to.equal('foo');
            done();
        });
    });

    it("prevents merging special fields", function(done){
        helper.get_original_package(only_package, function (err, helper) {
            expect(helper.scripts.prebuild).to.equal(undefined);
            expect(helper.dependencies.baar).to.equal(undefined);
            expect(helper.dependencies.bar).not.to.equal(undefined);
            done();
        });
    });

    it("use_inherits=true", function(done){
        helper.get_original_package(only_package, function (err, helper) {
            expect(helper.hasOwnProperty('name')).to.equal(false);
            done();
        }, true);
    });
});


describe("helper.save_package(cwd, json)", function(){
    var new_version = '10.3.4';

    it("could save to cortex.json", function(done){
        var dir = make(['cortex.json']);

        helper.get_original_package(dir, function (err, pkg) {
            pkg.version = new_version;

            helper.save_package(dir, pkg, function (err) {
                expect(err).to.equal(null);
                var json = fs.readJSON( node_path.join(dir, 'cortex.json') );

                expect(json.version).to.equal(new_version);
                done();
            });
        });
    });

    it("will save to package.json if cortex.json is not existed", function(done){
        var dir = make(['package.json']);

        helper.get_original_package(dir, function (err, pkg) {
            pkg.version = new_version;

            helper.save_package(dir, pkg, function (err) {
                expect(err).to.equal(null);
                var json = fs.readJSON( node_path.join(dir, 'package.json') );

                expect(json.cortex.version).to.equal(new_version);

                // should not affect pkg.version
                expect(json.version).not.to.equal(new_version);
                done();
            });
        }, true);
    });

    it("save to cortex.json if both exists", function(done){
        var dir = make(['package.json', 'cortex.json']);

        helper.get_original_package(dir, function (err, pkg) {
            pkg.version = new_version;

            helper.save_package(dir, pkg, function (err) {
                expect(err).to.equal(null);
                var json = fs.readJSON( node_path.join(dir, 'cortex.json') );

                // should not affect pkg.version
                expect(json.version).to.equal(new_version);
                expect('cortex' in json).to.equal(false);
                
                done();
            });
        });
    });
});




