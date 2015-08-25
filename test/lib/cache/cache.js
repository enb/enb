var fs = require('fs');
var path = require('path');
var mockFs = require('mock-fs');
var Cache = require('../../../lib/cache/cache');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('cache/cache', function () {
    var CACHE_FILE = path.resolve('cache.json');
    var TEST_FILE = path.resolve('test.txt');
    var PREFIX = 'test-prefix';
    var cacheStorage;
    var cache;

    before(function () {
        mockFs({});
        cacheStorage = new CacheStorage(CACHE_FILE);
    });

    beforeEach(function () {
        cache = new Cache(cacheStorage, PREFIX);
    });

    after(function () {
        mockFs.restore();
    });

    describe('constructor', function () {
        it('success', function () {
            cache._storage.should.be.instanceOf(CacheStorage);
            cache._prefix.should.equal(PREFIX);
        });
    });

    describe('get', function () {
        before(function () {
            cache._storage._data[PREFIX] = { key: 'value' };
        });

        it('success', function () {
            cache.get('key').should.equal('value');
        });
    });

    describe('set', function () {
        it('success', function () {
            cache.set('key', 'value');
            Object.keys(cache._storage._data[PREFIX]).should.have.length(1);
            cache._storage._data[PREFIX].key.should.equal('value');
        });
    });

    describe('invalidate', function () {
        before(function () {
            cache._storage._data[PREFIX] = { key: 'value' };
        });

        it('success', function () {
            Object.keys(cache._storage._data[PREFIX]).should.have.length(1);
            cache.invalidate('key');
            Object.keys(cache._storage._data[PREFIX]).should.have.length(0);
        });
    });

    describe('drop', function () {
        before(function () {
            cache._storage._data[PREFIX] = { key: 'value' };
        });

        it('success', function () {
            Object.keys(cache._storage._data).should.have.length(1);
            cache.drop();
            Object.keys(cache._storage._data).should.have.length(0);
        });
    });

    describe('subCache', function () {
        it('success', function () {
            var subCache = cache.subCache('subprefix');
            subCache.should.be.instanceOf(Cache);
            subCache._prefix.should.equal(PREFIX + '/' + 'subprefix');
        });
    });

    describe('_getFileInfo', function () {
        it('success', function () {
            var fileInfo = cache._getFileInfo(path.resolve(CACHE_FILE));

            fileInfo.should.be.instanceOf(Object);
            fileInfo.name.should.equal('cache.json');
            fileInfo.fullname.should.equal(path.resolve(CACHE_FILE));
            fileInfo.suffix.should.equal('json');
        });
    });

    describe('needRebuildFile', function () {
        describe('file does not exists in cache', function () {
            it('success', function () {
                cache.needRebuildFile('non-exist', TEST_FILE).should.equal(true);
            });
        });

        describe('file exists and actual', function () {
            before(function () {
                fs.writeFileSync(TEST_FILE, 'test data', { encoding: 'utf-8' });
                cache.set('test', {
                    fullname: TEST_FILE,
                    mtime: fs.statSync(TEST_FILE).mtime.getTime()
                });
            });

            it('success', function () {
                cache.needRebuildFile('test', TEST_FILE).should.equal(false);
            });

            after(function () {
                fs.unlinkSync(TEST_FILE);
            });
        });

        describe('file exists and expired', function () {
            before(function (done) {
                fs.writeFileSync(TEST_FILE, 'test data', { encoding: 'utf-8' });
                cache.set('test', {
                    fullname: TEST_FILE,
                    mtime: fs.statSync(TEST_FILE).mtime.getTime()
                });
                setTimeout(function () {
                    fs.writeFileSync(TEST_FILE, 'test data1', { encoding: 'utf-8' });
                    done();
                }, 1000);
            });

            it('success', function () {
                cache.needRebuildFile('test', TEST_FILE).should.equal(true);
            });

            after(function () {
                fs.unlinkSync(TEST_FILE);
            });
        });
    });

    describe('cacheFileInfo', function () {
        before(function () {
            fs.writeFileSync(TEST_FILE, 'test data', { encoding: 'utf-8' });
        });

        it('success', function () {
            cache.cacheFileInfo('test', TEST_FILE);

            var v = cache.get('test');
            v.should.be.instanceOf(Object);
            v.name.should.equal('test.txt');
            v.fullname.should.equal(TEST_FILE);
            v.suffix.should.equal('txt');
            v.mtime.should.equal(fs.statSync(TEST_FILE).mtime.getTime());
        });

        after(function () {
            fs.unlinkSync(TEST_FILE);
        });
    });

    describe('needRebuildFileList', function () {
        describe('not cached yet', function () {
            it('success', function () {
                cache.needRebuildFileList('test', []).should.equal(true);
            });
        });

        describe('number of files was changed', function () {
            before(function () {
                var basePath = './test/fixtures/';
                var file1 = path.resolve(basePath, 'test1.txt');
                var file2 = path.resolve(basePath, 'test2.txt');

                cache.set('test', [file1, file2]);
            });

            it('success', function () {
                cache.needRebuildFileList('test', []).should.equal(true);
            });
        });

        describe('any file in list was changed', function () {
            before(function () {
                var basePath = './test/fixtures/';
                var file1 = { fullname: path.resolve(basePath, 'test1.txt') };
                var file2 = { fullname: path.resolve(basePath, 'test2.txt') };

                cache.set('test', [file1, file2]);
            });

            it('success', function () {
                var basePath = './test/fixtures/';
                var file1 = { fullname: path.resolve(basePath, 'test11.txt') };
                var file2 = { fullname: path.resolve(basePath, 'test2.txt') };

                cache.needRebuildFileList('test', [file1, file2]).should.equal(true);
            });
        });

        describe('list was not changed', function () {
            var basePath = './test/fixtures/';
            var file1 = { fullname: path.resolve(basePath, 'test1.txt') };
            var file2 = { fullname: path.resolve(basePath, 'test2.txt') };

            before(function () {
                cache.set('test', [file1, file2]);
            });

            it('success', function () {
                cache.needRebuildFileList('test', [file1, file2]).should.equal(false);
            });
        });
    });

    describe('cacheFileList', function () {
        it('success', function () {
            cache.cacheFileList('key', [
                { key1: 'value1' },
                { key2: 'value2' }
            ]);
            cache.get('key').should.be.instanceOf(Array);
            cache.get('key').should.have.length(2);
        });
    });

    describe('destruct', function () {
        it('success', function () {
            expect(cache._storage).to.exist;
            cache.destruct();
            expect(cache._storage).to.not.exist;
        });
    });
});
