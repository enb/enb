var fs = require('fs');
var path = require('path');

var mockFs = require('mock-fs');
var _ = require('lodash');

var MakePlatform = require('../../../lib/make');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/cache', function () {
    var sandbox = sinon.sandbox.create();
    var makePlatform;
    var cacheStorage;

    beforeEach(function () {
        sandbox.stub(fs, 'existsSync');
        fs.existsSync
            .withArgs(path.normalize('/path/to/project/.enb'))
            .returns(true);
        fs.existsSync
            .withArgs(path.normalize('/path/to/project/.enb/make.js'))
            .returns(true);

        cacheStorage = sinon.createStubInstance(CacheStorage);

        makePlatform = new MakePlatform();
        makePlatform.setCacheStorage(cacheStorage);
    });

    afterEach(function () {
        sandbox.restore();
        mockFs.restore();
    });

    describe('loadCache', function () {
        it('should load data from cache storage', function () {
            makePlatform.loadCache();

            expect(cacheStorage.load).to.be.called;
        });

        it('should not drop cache if current cache attrs same with saved cache attrs', function () {
            setup(cacheStorage, makePlatform);

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.not.called;
        });

        it('should drop cache if cached mode is not equal current mode', function () {
            setup(cacheStorage, makePlatform, {
                currentMakePlatformMode: 'current_mode',
                cachedMakePlatformMode: 'cached_mode'
            });

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should drop cache if cached enb version differs from current enb version', function () {
            setup(cacheStorage, makePlatform, {
                currentENBVersion: 'current_ver',
                cachedENBVersion: 'saved_ver'
            });

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should drop cache if any makefile has mtime different from cached mtime for this file', function () {
            setup(cacheStorage, makePlatform, {
                currentMakeFileMtime: new Date(1),
                cachedMakeFileMtime: new Date(2)
            });

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });
    });

    describe('saveCache', function () {
        it('should save mode', function () {
            setup(cacheStorage, makePlatform, {
                currentMakePlatformMode: 'current_mode'
            });

            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'mode', 'current_mode');
        });

        it('should save enb version', function () {
            setup(cacheStorage, makePlatform, {
                currentENBVersion: 'test_ver'
            });

            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'version', 'test_ver');
        });

        it('should save makefile mtimes', function () {
            var expectedMakefiles = {};
            expectedMakefiles[path.normalize('/path/to/project/.enb/make.js')] = new Date(1).valueOf();

            setup(cacheStorage, makePlatform, {
                currentMakeFileMtime: new Date(1)
            });

            makePlatform.saveCache();

            expect(cacheStorage.set)
                .to.be.calledWith(':make', 'makefiles', expectedMakefiles);
        });

        it('should write cached data to disk', function () {
            makePlatform.saveCache();

            expect(cacheStorage.save).to.be.called;
        });
    });

    // skipped tests for cache attrs saving becausame with tests in saveCached with saveCache
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

/**
 * By default makePlatform.loadCache() will call cacheStorage.drop() if one of following:
 *  1. cached ENB version differs from actual
 *  2. actual make platfom mode differs from cached
 *  3. mtime of one of available makefiles differs from cached
 * Setup below configures cacheStorage in a way that makePlatform will not call cacheStorage.drop().
 * In each test checking cacheStorage.drop() is being called one of this conditions is being switched and
 * make platform behavior checked.
 */
function setup(cacheStorage, makePlatform, settings) {
    settings = settings || {};

    _.defaults(settings, {
        currentENBVersion: 'defaultENBVersion',
        cachedENBVersion: 'defaultENBVersion',
        currentMakePlatformMode: 'defaultMakePlatformMode',
        cachedMakePlatformMode: 'defaultMakePlatformMode',
        currentMakeFileMtime: new Date(1),
        cachedMakeFileMtime: new Date(1)
    });

    var makeFiles = {};
    makeFiles[path.normalize('/path/to/project/.enb/make.js')] = settings.cachedMakeFileMtime.valueOf();

    cacheStorage.get.withArgs(':make', 'version').returns(settings.cachedENBVersion);
    cacheStorage.get.withArgs(':make', 'mode').returns(settings.cachedMakePlatformMode);
    cacheStorage.get.withArgs(':make', 'makefiles').returns(makeFiles);

    mockFs({
        '/path/to/project': {
            '.enb': {
                'make.js': mockFs.file({
                    mtime: settings.currentMakeFileMtime
                })
            }
        },
        'package.json': '{ "version": "' + settings.currentENBVersion + '" }'
    });

    makePlatform.init('/path/to/project', settings.currentMakePlatformMode);
}
