'use strict';

var pkg = require('../../../lib/util/package');
var expect = require('chai').expect;
var fs = require('fs');

var node_path = require('path');

var root = node_path.resolve('test', 'fixtures', 'util');

describe("pkg.get_package_file(cwd)", function(){
    it("pkg.is_cortex_json", function(){
        expect(pkg.is_cortex_json( '/xxx/xxx/xx/cortex.json' )).to.equal(true);
        expect(pkg.is_cortex_json( '/xxx/xxx/xx/package.json' )).to.equal(false);
    });

    it("returns package.json if cortex.json is not existed", function(done){
        var cwd = node_path.join(root, 'only-package');

        pkg.get_package_file(cwd, function (err, file) {
            expect(err).to.equal(null);
            expect( pkg.is_cortex_json(file) ).to.equal(false);
            
            done();
        });
    });

    it("returns cortex.json if existed", function(done){
        var cwd = node_path.join(root, 'hybrid');

        pkg.get_package_file(cwd, function (err, file) {
            expect(err).to.equal(null);
            expect(pkg.is_cortex_json(file)).to.equal(true);
            done();
        });
    });

    it("throws error if neither is existed, strict=true", function(done){
        var cwd = node_path.join(root, 'non-existing');

        pkg.get_package_file(cwd, function (err, file) {
            expect(err).not.to.equal(null);
            done();
        }, true);
    });

    it("won't throw error if neither is existed, strict=", function(done){
        var cwd = node_path.join(root, 'non-existing');

        pkg.get_package_file(cwd, function (err, file) {
            expect(err).to.equal(null);
            done();
        });
    });
});


describe("pkg.get_original_package(cwd)", function(){
    it("merges normal fields", function(done){
        var cwd = node_path.join(root, 'only-package');

        pkg.get_original_package(cwd, function (err, pkg) {
            expect(pkg.name).to.equal('foo');
            done();
        });
    });

    it("prevents merging special fields", function(done){
        var cwd = node_path.join(root, 'only-package');

        pkg.get_original_package(cwd, function (err, pkg) {
            expect(pkg.scripts.prebuild).to.equal(undefined);
            expect(pkg.dependencies.baar).to.equal(undefined);
            expect(pkg.dependencies.bar).not.to.equal(undefined);
            done();
        });
    });

    it("use_inherits=true", function(done){
        var cwd = node_path.join(root, 'only-package');

        pkg.get_original_package(cwd, function (err, pkg) {
            expect(pkg.hasOwnProperty('name')).to.equal(false);
            done();
        }, true);
    });
});

