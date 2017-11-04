'use strict'

const fs = require('fs');
const path = require('path');

const mockFs = require('mock-fs');

const MakePlatform = require('../../../lib/make');
const CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/cache', () => {
    const sandbox = sinon.sandbox.create();
    let makePlatform;
    let cacheStorage;

    beforeEach(() => {
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

    afterEach(() => {
        sandbox.restore();
        mockFs.restore();
    });

    describe('loadCache', () => {
        it('should load data from cache storage', () => {
            makePlatform.loadCache();

            expect(cacheStorage.load).to.be.called;
        });

        it('should not drop cache if current cache attrs same with saved cache attrs', () => {
            setup(cacheStorage, makePlatform);

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.not.called;
        });

        it('should drop cache if cached mode is not equal current mode', () => {
            setup(cacheStorage, makePlatform, {
                currentMakePlatformMode: 'current_mode',
                cachedMakePlatformMode: 'cached_mode'
            });

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should drop cache if cached enb version differs from current enb version', () => {
            setup(cacheStorage, makePlatform, {
                currentENBVersion: 'current_ver',
                cachedENBVersion: 'saved_ver'
            });

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should drop cache if any makefile has mtime different from cached mtime for this file', () => {
            setup(cacheStorage, makePlatform, {
                currentMakeFileMtime: new Date(1),
                cachedMakeFileMtime: new Date(2)
            });

            makePlatform.loadCache();

            expect(cacheStorage.drop).to.be.called;
        });
    });

    describe('saveCache', () => {
        it('should save mode', () => {
            setup(cacheStorage, makePlatform, {
                currentMakePlatformMode: 'current_mode'
            });

            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'mode', 'current_mode');
        });

        it('should save enb version', () => {
            setup(cacheStorage, makePlatform, {
                currentENBVersion: 'test_ver'
            });

            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'version', 'test_ver');
        });

        it('should save makefile mtimes', () => {
            const expectedMakefiles = {};
            expectedMakefiles[path.normalize('/path/to/project/.enb/make.js')] = new Date(1).valueOf();

            setup(cacheStorage, makePlatform, {
                currentMakeFileMtime: new Date(1)
            });

            makePlatform.saveCache();

            expect(cacheStorage.set)
                .to.be.calledWith(':make', 'makefiles', expectedMakefiles);
        });

        it('should write cached data to disk', () => {
            makePlatform.saveCache();

            expect(cacheStorage.save).to.be.called;
        });
    });

    // skipped tests for cache attrs saving becausame with tests in saveCached with saveCache
    describe('saveCacheAsync', () => {
        it('should write cached data to disk', () => {
            makePlatform.saveCacheAsync();

            expect(cacheStorage.saveAsync).to.be.called;
        });
    });

    describe('dropCache', () => {
        it('should drop cache', () => {
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
 * @param {Object} cacheStorage
 * @param {Object} makePlatform
 * @param {Object} settings
 */
function setup(cacheStorage, makePlatform, settings) {
    const defaults = {
        currentENBVersion: 'defaultENBVersion',
        cachedENBVersion: 'defaultENBVersion',
        currentMakePlatformMode: 'defaultMakePlatformMode',
        cachedMakePlatformMode: 'defaultMakePlatformMode',
        currentMakeFileMtime: new Date(1),
        cachedMakeFileMtime: new Date(1)
    };

    settings = Object.assign({}, defaults, settings);

    const makeFiles = {};
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
        'package.json': `{ "version": "${settings.currentENBVersion}" }`
    });

    makePlatform.init('/path/to/project', settings.currentMakePlatformMode);
}
