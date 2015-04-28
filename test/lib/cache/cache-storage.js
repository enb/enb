var fs = require('fs'),
    path = require('path'),
    CacheStorage = require('../../../lib/cache/cache-storage');

require('chai').should();

describe('cache/cache-storage', function () {
    var CACHE_FILE = path.join(process.cwd(), './test/fixtures/cache.json'),
        INVALID_FILE = path.join(process.cwd(), './test/fixtures/cache.txt'),
        TEST_DATA = {
            prefix1: {
                key1: 'value1',
                key2: 'value2'
            }
        };

    describe('constructor', function () {
        it('success', function () {
            var cacheStorage = new CacheStorage(CACHE_FILE);

            cacheStorage._filename.should.equal(CACHE_FILE);
            cacheStorage._data.should.be.instanceOf(Object);
            Object.keys(cacheStorage._data).should.have.length(0);
            cacheStorage._mtime.should.equal(0);
        });
    });

    describe('load', function () {
        var cacheStorage;

        beforeEach(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
        });

        describe('without file', function () {
            it('success', function () {
                cacheStorage.load();
                cacheStorage._data.should.be.instanceOf(Object);
                Object.keys(cacheStorage._data).should.have.length(0);
            });
        });

        describe('with invalid json file', function () {
            it('success', function () {
                fs.writeFileSync(INVALID_FILE, -1, { encoding: 'utf-8' });
                cacheStorage = new CacheStorage(INVALID_FILE);
                cacheStorage.load();
                cacheStorage._data.should.be.instanceOf(Object);
                Object.keys(cacheStorage._data).should.have.length(0);
                cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
            });
        });

        describe('with valid json file', function () {
            it('success', function () {
                var d = { key: 'value' };
                fs.writeFileSync(CACHE_FILE, JSON.stringify(d), { encoding: 'utf-8' });
                cacheStorage.load();

                cacheStorage._data.should.be.instanceOf(Object);
                Object.keys(cacheStorage._data).should.have.length(1);
                cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
            });
        });

        after(function () {
            fs.unlinkSync(CACHE_FILE);
            fs.unlinkSync(INVALID_FILE);
        });
    });

    describe('save', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
            cacheStorage._data = Object.create(TEST_DATA);
        });

        it('success', function () {
            fs.existsSync(CACHE_FILE).should.equal(false);
            cacheStorage.save();
            fs.existsSync(CACHE_FILE).should.equal(true);
            cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
        });

        after(function () {
            fs.unlinkSync(CACHE_FILE);
        });
    });

    describe('saveAsync', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
            cacheStorage._data = Object.create(TEST_DATA);
        });

        it('success', function (done) {
            fs.existsSync(CACHE_FILE).should.equal(false);
            cacheStorage.saveAsync().then(function () {
                fs.existsSync(CACHE_FILE).should.equal(true);
                cacheStorage._mtime.should.equal(fs.statSync(cacheStorage._filename).mtime.getTime());
                done();
            });
        });

        after(function () {
            fs.unlinkSync(CACHE_FILE);
        });
    });

    describe('get', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
            cacheStorage._data = Object.create(TEST_DATA);
        });

        it('success', function () {
            cacheStorage.get('prefix1', 'key1').should.equal('value1');
            cacheStorage.get('prefix1', 'key2').should.equal('value2');
        });
    });

    describe('set', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
        });

        it('prefix not-exists', function () {
            Object.keys(cacheStorage._data).should.have.length(0);
            cacheStorage.set('prefix1', 'key1', 'value1');
            Object.keys(cacheStorage._data).should.have.length(1);
            Object.keys(cacheStorage._data['prefix1']).should.have.length(1);

        });

        it('prefix exists', function () {
            cacheStorage.set('prefix1', 'key2', 'value2');
            Object.keys(cacheStorage._data['prefix1']).should.have.length(2);
        });
    });

    describe('invalidate', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
            cacheStorage._data = Object.create(TEST_DATA);
        });

        it('success', function () {
            Object.keys(cacheStorage._data['prefix1']).should.have.length(2);
            cacheStorage.invalidate('prefix1', 'key1');
            Object.keys(cacheStorage._data['prefix1']).should.have.length(1);
        });
    });

    describe('dropPrefix', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
            cacheStorage._data = JSON.parse(JSON.stringify(TEST_DATA));
        });

        it('success', function () {
            Object.keys(cacheStorage._data).should.have.length(1);
            cacheStorage.dropPrefix('prefix1');
            Object.keys(cacheStorage._data).should.have.length(0);
        });
    });

    describe('drop', function () {
        var cacheStorage;

        before(function () {
            cacheStorage = new CacheStorage(CACHE_FILE);
            cacheStorage._data = JSON.parse(JSON.stringify(TEST_DATA));
        });

        it('success', function () {
            Object.keys(cacheStorage._data).should.have.length(1);
            cacheStorage.drop();
            Object.keys(cacheStorage._data).should.have.length(0);
        });
    });
});
