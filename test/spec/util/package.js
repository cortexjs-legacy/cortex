'use strict';

var pkg = require('../../../lib/util/package');
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


describe("pkg.get_package_file(cwd)", function(){
    it("pkg.is_cortex_json", function(){
        expect(pkg.is_cortex_json( '/xxx/xxx/xx/cortex.json' )).to.equal(true);
        expect(pkg.is_cortex_json( '/xxx/xxx/xx/package.json' )).to.equal(false);
    });

    it("returns package.json if cortex.json is not existed", function(done){
        pkg.get_package_file(only_package, function (err, file) {
            expect(err).to.equal(null);
            expect( pkg.is_cortex_json(file) ).to.equal(false);
            
            done();
        });
    });

    it("returns cortex.json if existed", function(done){
        pkg.get_package_file(hybrid, function (err, file) {
            expect(err).to.equal(null);
            expect(pkg.is_cortex_json(file)).to.equal(true);
            done();
        });
    });

    it("throws error if neither is existed, strict=true", function(done){
        pkg.get_package_file(non_existing, function (err, file) {
            expect(err).not.to.equal(null);
            done();
        }, true);
    });

    it("won't throw error if neither is existed, strict=", function(done){
        pkg.get_package_file(non_existing, function (err, file) {
            expect(err).to.equal(null);
            done();
        });
    });
});


describe("pkg.get_original_package(cwd)", function(){
    it("merges normal fields", function(done){
        pkg.get_original_package(only_package, function (err, pkg) {
            expect(pkg.name).to.equal('foo');
            done();
        });
    });

    it("prevents merging special fields", function(done){
        pkg.get_original_package(only_package, function (err, pkg) {
            expect(pkg.scripts.prebuild).to.equal(undefined);
            expect(pkg.dependencies.baar).to.equal(undefined);
            expect(pkg.dependencies.bar).not.to.equal(undefined);
            done();
        });
    });

    it("use_inherits=true", function(done){
        pkg.get_original_package(only_package, function (err, pkg) {
            expect(pkg.hasOwnProperty('name')).to.equal(false);
            done();
        }, true);
    });
});




