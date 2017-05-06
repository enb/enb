var mockFs = require('mock-fs');
var Cache = require('../../../lib/cache/cache');
var CacheStorage = require('../../../lib/cache/cache-storage');
var FileCache = require('../../../lib/cache/file-cache');

describe('cache/cache', function () {
    var sandbox = sinon.sandbox.create();

    afterEach(function () {
        sandbox.restore();
        mockFs.restore();
    });

    function mkStorage_() {
        var cacheStorage = sinon.createStubInstance(CacheStorage);
        cacheStorage.fileCache = sinon.createStubInstance(FileCache);
        return cacheStorage;
    }

    function createCache_(params) {
        params = params || {};

        return new Cache(
            params.storage || mkStorage_(),
            params.prefix || 'default_prefix'
        );
    }

    describe('constructor', function () {
        it('should set cache storage', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({ storage: cacheStorage });

            cache.get();

            expect(cacheStorage.get).to.be.called;
        });

        it('should set prefix', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.get();

            expect(cacheStorage.get).to.be.calledWith('testPrefix');
        });
    });

    describe('destruct', function () {
        it('should delete reference to cache storage', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({ storage: cacheStorage });

            cache.destruct();

            expect(function () { cache.get(); }).to.throw();
        });
    });

    describe('get', function () {
        it('should query data by cache prefix and key',  function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.get('testKey');

            expect(cacheStorage.get).to.be.calledWith('testPrefix', 'testKey');
        });
    });

    describe('set', function () {
        it('should set data to cache storage', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({ storage: cacheStorage });

            cache.set();

            expect(cacheStorage.set).to.be.called;
        });

        it('should set value by cache prefix and key', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.set('testKey', 'test_data');

            expect(cacheStorage.set).to.be.calledWith('testPrefix', 'testKey', 'test_data');
        });
    });

    describe('getFile', function () {
        it('should redirect call to fileCache', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'some/node'
            });

            cache.getFile('some/key', 100500);

            expect(cacheStorage.fileCache.get).to.be.calledWith('some/node/some/key', 100500);
        });

        it('should not add node prefix if corresponding option set', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'some/node'
            });

            cache.getFile('some/key', 100500, { nodePrefix: false });

            expect(cacheStorage.fileCache.get).to.be.calledWith('some/key', 100500);
        });
    });

    describe('putFile', function () {
        it('should redirect call to fileCache', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'some/node'
            });

            cache.putFile('some/key', 'some-content');

            expect(cacheStorage.fileCache.put).to.be.calledWith('some/node/some/key', 'some-content');
        });

        it('should not add node prefix if corresponding option set', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'some/node'
            });

            cache.putFile('some/key', 'some-content', { nodePrefix: false });

            expect(cacheStorage.fileCache.put).to.be.calledWith('some/key', 'some-content');
        });
    });

    describe('invalidate', function () {
        it('should invalidate data in cache storage', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({ storage: cacheStorage });

            cache.invalidate();

            expect(cacheStorage.invalidate).to.be.called;
        });

        it('should invalidate data by cache prefix and key', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.invalidate('testKey');

            expect(cacheStorage.invalidate).to.be.calledWith('testPrefix', 'testKey');
        });
    });

    describe('drop', function () {
        it('should drop data by prefix in cache storage', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({ storage: cacheStorage });

            cache.drop();

            expect(cacheStorage.dropPrefix).to.be.called;
        });

        it('should drop data by cache prefix and key', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.drop();

            expect(cacheStorage.dropPrefix).to.be.calledWith('testPrefix');
        });
    });

    describe('subCache', function () {
        it('should return cache', function () {
            var cache = createCache_();
            var subCache = cache.subCache();

            expect(subCache).to.be.instanceOf(Cache);
        });

        it('should pass cache storage to new cache', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({ storage: cacheStorage });
            var subCache = cache.subCache();

            subCache.get();

            expect(cacheStorage.get).to.be.called;
        });

        it('should create new cache with additional prefix based on parent cache prefix', function () {
            var cacheStorage = mkStorage_();
            var cache = createCache_({
                storage: cacheStorage,
                prefix: 'cache_prefix'
            });
            var subCache = cache.subCache('subcache_prefix');

            subCache.get();

            expect(cacheStorage.get).to.be.calledWith('cache_prefix/subcache_prefix');
        });
    });

    describe('needRebuildFile', function () {
        it('should return true if no info about file cached', function () {
            var cache = createCache_();

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(undefined);

            expect(cache.needRebuildFile('cache_key')).to.be.true;
        });

        it('should return true if cached mtime is not equal current mtime for required file', function () {
            mockFs({
                '/path/to/test_file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            var cache = createCache_();
            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns({ mtime: new Date(2).valueOf() });

            expect(cache.needRebuildFile('cache_key', '/path/to/test_file.js')).to.be.true;
        });

        it('should return false if cached mtime equal to current mtime for required file', function () {
            mockFs({
                '/path/to/test_file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            var cache = createCache_();
            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns({ mtime: new Date(1).valueOf() });

            expect(cache.needRebuildFile('cache_key', '/path/to/test_file.js')).to.be.false;
        });
    });

    describe('cacheFileInfo', function () {
        it('should cache info about file', function () {
            mockFs({
                '/path/to/test_file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            var cache = createCache_();

            sandbox.stub(cache, 'set');

            cache.cacheFileInfo('cache_key', '/path/to/test_file.js');

            expect(cache.set).to.be.calledWithMatch('cache_key', {
                name: 'test_file.js',
                fullname: '/path/to/test_file.js',
                suffix: 'js',
                mtime: 1
            });
        });
    });

    describe('needRebuildFileList', function () {
        it('should return true if no info about file list cached', function () {
            var cache = createCache_();

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(undefined);

            expect(cache.needRebuildFileList('cache_key')).to.be.true;
        });

        it('should return true if not a file list cached for specific key', function () {
            var cache = createCache_();

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns({ filename: 'file.js' });

            expect(cache.needRebuildFileList('cache_key')).to.be.true;
        });

        it('should return true if cached files list length differs from passed files list', function () {
            var cache = createCache_();
            var fileList = [
                { fullname: '/path/to/file.js' },
                { fullname: '/path/to/another_file.js' }
            ];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns([{ fullname: '/path/to/file.js' }]);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.true;
        });

        it('should return true if file full name in cached file list differs from file full name in ' +
            'passed file list', function () {
            var cache = createCache_();
            var fileList = [{ fullname: '/path/to/file.js', mtime: 1 }];
            var cachedFileList = [{ fullname: '/path/to/another_file.js', mtime: 1 }];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(cachedFileList);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.true;
        });

        it('should return true if file mtime in cached file list differs from file mtime in passed file ' +
            'list', function () {
            var cache = createCache_();
            var fileList = [{ fullname: '/path/to/file.js', mtime: 1 }];
            var cachedFileList = [{ fullname: '/path/to/file.js', mtime: 2 }];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(cachedFileList);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.true;
        });

        it('should return false for same file lists', function () {
            var cache = createCache_();
            var fileList = [{ fullname: '/path/to/file.js', mtime: 1 }];
            var cachedFileList = [{ fullname: '/path/to/file.js', mtime: 1 }];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(cachedFileList);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.false;
        });
    });

    describe('cacheFileList', function () {
        it('should set file list for sepcific key', function () {
            var cache = createCache_();

            sinon.stub(cache, 'set');
            cache.set('testKey', [{ fullname: '/path/to/test_file.js', mtime: 1 }]);

            expect(cache.set).to.be.calledWith('testKey', [{ fullname: '/path/to/test_file.js', mtime: 1 }]);
        });
    });
});
