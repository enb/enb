'use strict'

const mockFs = require('mock-fs');
const Cache = require('../../../lib/cache/cache');
const CacheStorage = require('../../../lib/cache/cache-storage');

describe('cache/cache', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => {
        sandbox.restore();
        mockFs.restore();
    });

    describe('constructor', () => {
        it('should set cache storage', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({ storage: cacheStorage });

            cache.get();

            expect(cacheStorage.get).to.be.called;
        });

        it('should set prefix', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.get();

            expect(cacheStorage.get).to.be.calledWith('testPrefix');
        });
    });

    describe('destruct', () => {
        it('should delete reference to cache storage', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({ storage: cacheStorage });

            cache.destruct();

            expect(() => { cache.get(); }).to.throw();
        });
    });

    describe('get', () => {
        it('should query data by cache prefix and key',  () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.get('testKey');

            expect(cacheStorage.get).to.be.calledWith('testPrefix', 'testKey');
        });
    });

    describe('set', () => {
        it('should set data to cache storage', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({ storage: cacheStorage });

            cache.set();

            expect(cacheStorage.set).to.be.called;
        });

        it('should set value by cache prefix and key', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.set('testKey', 'test_data');

            expect(cacheStorage.set).to.be.calledWith('testPrefix', 'testKey', 'test_data');
        });
    });

    describe('invalidate', () => {
        it('should invalidate data in cache storage', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({ storage: cacheStorage });

            cache.invalidate();

            expect(cacheStorage.invalidate).to.be.called;
        });

        it('should invalidate data by cache prefix and key', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.invalidate('testKey');

            expect(cacheStorage.invalidate).to.be.calledWith('testPrefix', 'testKey');
        });
    });

    describe('drop', () => {
        it('should drop data by prefix in cache storage', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({ storage: cacheStorage });

            cache.drop();

            expect(cacheStorage.dropPrefix).to.be.called;
        });

        it('should drop data by cache prefix and key', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({
                storage: cacheStorage,
                prefix: 'testPrefix'
            });

            cache.drop();

            expect(cacheStorage.dropPrefix).to.be.calledWith('testPrefix');
        });
    });

    describe('subCache', () => {
        it('should return cache', () => {
            const cache = createCache_();
            const subCache = cache.subCache();

            expect(subCache).to.be.instanceOf(Cache);
        });

        it('should pass cache storage to new cache', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({ storage: cacheStorage });
            const subCache = cache.subCache();

            subCache.get();

            expect(cacheStorage.get).to.be.called;
        });

        it('should create new cache with additional prefix based on parent cache prefix', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            const cache = createCache_({
                storage: cacheStorage,
                prefix: 'cache_prefix'
            });
            const subCache = cache.subCache('subcache_prefix');

            subCache.get();

            expect(cacheStorage.get).to.be.calledWith('cache_prefix/subcache_prefix');
        });
    });

    describe('needRebuildFile', () => {
        it('should return true if no info about file cached', () => {
            const cache = createCache_();

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(undefined);

            expect(cache.needRebuildFile('cache_key')).to.be.true;
        });

        it('should return true if cached mtime is not equal current mtime for required file', () => {
            mockFs({
                '/path/to/test_file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            const cache = createCache_();
            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns({ mtime: new Date(2).valueOf() });

            expect(cache.needRebuildFile('cache_key', '/path/to/test_file.js')).to.be.true;
        });

        it('should return false if cached mtime equal to current mtime for required file', () => {
            mockFs({
                '/path/to/test_file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            const cache = createCache_();
            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns({ mtime: new Date(1).valueOf() });

            expect(cache.needRebuildFile('cache_key', '/path/to/test_file.js')).to.be.false;
        });
    });

    describe('cacheFileInfo', () => {
        it('should cache info about file', () => {
            mockFs({
                '/path/to/test_file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            const cache = createCache_();

            sandbox.stub(cache, 'set');

            cache.cacheFileInfo('cache_key', '/path/to/test_file.js');

            expect(cache.set).to.be.calledWith('cache_key', {
                name: 'test_file.js',
                fullname: '/path/to/test_file.js',
                suffix: 'js',
                mtime: 1
            });
        });
    });

    describe('needRebuildFileList', () => {
        it('should return true if no info about file list cached', () => {
            const cache = createCache_();

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(undefined);

            expect(cache.needRebuildFileList('cache_key')).to.be.true;
        });

        it('should return true if not a file list cached for specific key', () => {
            const cache = createCache_();

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns({ filename: 'file.js' });

            expect(cache.needRebuildFileList('cache_key')).to.be.true;
        });

        it('should return true if cached files list length differs from passed files list', () => {
            const cache = createCache_();
            const fileList = [
                { fullname: '/path/to/file.js' },
                { fullname: '/path/to/another_file.js' }
            ];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns([{ fullname: '/path/to/file.js' }]);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.true;
        });

        it('should return true if file full name in cached file list differs from file full name in ' +
            'passed file list', () => {
            const cache = createCache_();
            const fileList = [{ fullname: '/path/to/file.js', mtime: 1 }];
            const cachedFileList = [{ fullname: '/path/to/another_file.js', mtime: 1 }];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(cachedFileList);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.true;
        });

        it('should return true if file mtime in cached file list differs from file mtime in passed file ' +
            'list', () => {
            const cache = createCache_();
            const fileList = [{ fullname: '/path/to/file.js', mtime: 1 }];
            const cachedFileList = [{ fullname: '/path/to/file.js', mtime: 2 }];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(cachedFileList);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.true;
        });

        it('should return false for same file lists', () => {
            const cache = createCache_();
            const fileList = [{ fullname: '/path/to/file.js', mtime: 1 }];
            const cachedFileList = [{ fullname: '/path/to/file.js', mtime: 1 }];

            sandbox.stub(cache, 'get');
            cache.get.withArgs('cache_key').returns(cachedFileList);

            expect(cache.needRebuildFileList('cache_key', fileList)).to.be.false;
        });
    });

    describe('cacheFileList', () => {
        it('should set file list for sepcific key', () => {
            const cache = createCache_();

            sinon.stub(cache, 'set');
            cache.set('testKey', [{ fullname: '/path/to/test_file.js', mtime: 1 }]);

            expect(cache.set).to.be.calledWith('testKey', [{ fullname: '/path/to/test_file.js', mtime: 1 }]);
        });
    });

    function createCache_(params) {
        params = params || {};

        return new Cache(
            params.storage || sinon.createStubInstance(CacheStorage),
            params.prefix || 'default_prefix'
        );
    }
});
