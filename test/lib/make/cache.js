var path = require('path');
var mockFs = require('mock-fs');
var clearRequire = require('clear-require');
var MakePlatform = require('../../../lib/make');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/cache', function () {
    var makePlatform;
    var cacheStorage;

    beforeEach(function () {
        mockFs({
            '/path/to/project': {
                '.enb': {
                    'make.js': mockFs.file({
                        mtime: new Date(1)
                    })
                }
            },
            'package.json': '{ "version": "test_ver" }'
        });

        cacheStorage = sinon.createStubInstance(CacheStorage);

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode');
        makePlatform.setCacheStorage(cacheStorage);
    });

    afterEach(function () {
        mockFs.restore();
    });

    describe('loadCache', function () {
        beforeEach(function () {
            clearRequire('../../../package.json');
            setupToNotDrop(cacheStorage);
        });

        it('should load data from cache storage', function () {
            makePlatform.loadCache();

            expect(cacheStorage.load).to.be.called;
        });

        it('should not drop cache if cache attrs same with existing cache attrs', function () {
            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.not.called;
        });

        it('should drop cache if cached mode is not equal current mode', function () {
            cacheStorage.get.withArgs(':make', 'mode').returns('another_mode');

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should drop cache if cached enb version differs from current enb version', function () {
            cacheStorage.get.withArgs(':make', 'version').returns('another_enb_version');

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should drop cache if any makefile has mtime different from cached mtime for this file', function () {
            var makeFiles = {};
            makeFiles['/path/to/project/.enb/make.js'] = new Date(2).valueOf();

            cacheStorage.get.withArgs(':make', 'makefiles').returns(makeFiles);

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });
    });

    describe('saveCache', function () {
        it('should save mode', function () {
            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'mode', 'mode');
        });

        it('should save enb version', function () {
            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'version', 'test_ver');
        });

        it('should save makefile mtimes', function () {
            makePlatform.saveCache();

            //no mtimes because initialized with config function
            expect(cacheStorage.set).to.be.calledWith(':make', 'makefiles');
        });

        it('should write cached data to disk', function () {
            makePlatform.saveCache();

            expect(cacheStorage.save).to.be.called;
        });
    });

    //skipped tests for cache attrs saving becausame with tests in saveCached with saveCache
    describe('saveCacheAsync', function () {
        it('should write cached data to disk', function () {
            makePlatform.saveCacheAsync();

            expect(cacheStorage.saveAsync).to.be.called;
        });
    });

    describe('dropCache', function () {
        it('should drop cache', function () {
            makePlatform.dropCache();

            expect(cacheStorage.drop).to.be.called;
        });
    });
});

function setupToNotDrop(cacheStorage) {
    /**
     * By default makePlatform.loadCache() will call cacheStorage.drop() if one of following:
     *  1. cached ENB version differs from actual
     *  2. actual make platfom mode differs from cached
     *  3. mtime of one of available makefiles differs from cached
     * Setup below configures cacheStorage in a way that makePlatform will not call cacheStorage.drop().
     * In each test checking cacheStorage.drop() is being called one of this conditions is being switched and
     * make platform behavior checked.
     */
    var makeFiles = {};
    makeFiles[path.normalize('/path/to/project/.enb/make.js')] = new Date(1).valueOf();

    cacheStorage.get.withArgs(':make', 'version').returns('test_ver');
    cacheStorage.get.withArgs(':make', 'mode').returns('mode');
    cacheStorage.get.withArgs(':make', 'makefiles').returns(makeFiles);
}
