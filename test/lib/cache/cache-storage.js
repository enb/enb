var fs = require('fs');
var path = require('path');
var mockFs = require('mock-fs');
var CacheStorage = require('../../../lib/cache/cache-storage');

require('chai').should();

describe('cache/cache-storage', function () {
    var CACHE_FILE = path.resolve('cache.json');
    var INVALID_FILE = path.resolve('cache.txt');
    var TEST_DATA = {
            prefix1: {
                key1: 'value1',
                key2: 'value2'
            }
        };

    beforeEach(function () {
        mockFs({});
    });

    afterEach(function () {
        mockFs.restore();
    });

    describe('constructor', function () {
        it('success', function () {
            var cacheStorage = new CacheStorage(CACHE_FILE);

            cacheStorage._filename.should.equal(CACHE_FILE);
            cacheStorage._data.should.be.instanceOf(Object);
            Object.keys(cacheStorage._data).should.have.length(0);
            cacheStorage._mtime.should.equal(0);
        });
    });

    describe('instance methods', function () {
        var cacheStorage;

        beforeEach(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
        });

        describe('load', function () {
            it('should load without file', function () {
                cacheStorage.load();
                cacheStorage._data.should.be.instanceOf(Object);
                Object.keys(cacheStorage._data).should.have.length(0);
            });

            it('should load with invalid json file', function () {
                fs.writeFileSync(INVALID_FILE, -1, { encoding: 'utf-8' });
                cacheStorage = new CacheStorage(INVALID_FILE);
                cacheStorage.load();
                cacheStorage._data.should.be.instanceOf(Object);
                Object.keys(cacheStorage._data).should.have.length(0);
                cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
            });

            it('should load with valid json file', function () {
                var d = { key: 'value' };
                fs.writeFileSync(CACHE_FILE, JSON.stringify(d), { encoding: 'utf-8' });
                cacheStorage.load();

                cacheStorage._data.should.be.instanceOf(Object);
                Object.keys(cacheStorage._data).should.have.length(1);
                cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
            });
        });

        describe('set', function () {
            it('prefix not-exists', function () {
                Object.keys(cacheStorage._data).should.have.length(0);
                cacheStorage.set('prefix1', 'key1', 'value1');
                Object.keys(cacheStorage._data).should.have.length(1);
                Object.keys(cacheStorage._data.prefix1).should.have.length(1);

            });

            it('prefix exists', function () {
                cacheStorage.set('prefix1', 'key1', 'value1');
                cacheStorage.set('prefix1', 'key2', 'value2');
                Object.keys(cacheStorage._data.prefix1).should.have.length(2);
            });
        });

        describe('with predefined data', function () {
            beforeEach(function () {
                cacheStorage._data = JSON.parse(JSON.stringify(TEST_DATA));
            });

            describe('save', function () {
                it('should save synchronous', function () {
                    fs.existsSync(CACHE_FILE).should.equal(false);
                    cacheStorage.save();
                    fs.existsSync(CACHE_FILE).should.equal(true);
                    cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
                });

                it('should save asynchronous', function (done) {
                    fs.existsSync(CACHE_FILE).should.equal(false);
                    cacheStorage.saveAsync().then(function () {
                        fs.existsSync(CACHE_FILE).should.equal(true);
                        cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
                        done();
                    });
                });
            });

            it('should get valid data from cache', function () {
                cacheStorage.get('prefix1', 'key1').should.equal('value1');
                cacheStorage.get('prefix1', 'key2').should.equal('value2');
            });

            it('should invalidate cached data properly', function () {
                Object.keys(cacheStorage._data.prefix1).should.have.length(2);
                cacheStorage.invalidate('prefix1', 'key1');
                Object.keys(cacheStorage._data.prefix1).should.have.length(1);
            });

            it('should drop prefix in cache', function () {
                Object.keys(cacheStorage._data).should.have.length(1);
                cacheStorage.dropPrefix('prefix1');
                Object.keys(cacheStorage._data).should.have.length(0);
            });

            it('should drop data in cache', function () {
                Object.keys(cacheStorage._data).should.have.length(1);
                cacheStorage.drop();
                Object.keys(cacheStorage._data).should.have.length(0);
            });
        });
    });
});
