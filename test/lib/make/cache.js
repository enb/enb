var fs = require('fs');
var mockFs = require('mock-fs');
var MakePlatform = require('../../../lib/make');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/init', function () {
    var makePlatform;
    var cacheStorage;

    beforeEach(function () {
        sinon.stub(fs, 'existsSync');
        fs.existsSync.withArgs('/path/to/project/.enb').returns(true);
        fs.existsSync.withArgs('/path/to/project/.enb/make.js').returns(true);

        cacheStorage = sinon.createStubInstance(CacheStorage);

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {});
        makePlatform.setCacheStorage(cacheStorage);
    });

    afterEach(function () {
        sinon.sandbox.restore();
        fs.existsSync.restore();
    });

    describe('loadCache', function () {
        beforeEach(function () {
            var version = require('../../../package.json').version;

            //stubbing cacheStorage in order to drop not called by default
            cacheStorage.get.withArgs(':make', 'version').returns(version);
            cacheStorage.get.withArgs(':make', 'mode').returns('mode');
            cacheStorage.get.withArgs(':make', 'makefiles').returns({});
        });

        it('should load data from cache storage', function () {
            makePlatform.loadCache();

            expect(cacheStorage.load).to.be.called;
        });

        it('should not drop cache if cached mode equal to current mode, cached enb version equal to current enb ' +
            'version and cached config files mtimes are equal current config files mtimes', function () {
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

        describe('drop on mtime change test', function () {
            beforeEach(function () {
                mockFs({
                    '/path/to/project/.enb/': {
                        'make.js': mockFs.file({
                            mtime: new Date(1),
                            content: 'module.exports = function () {};'
                        })
                    }
                });

                makePlatform.init('/path/to/project', 'mode'); //2nd init because need to read mocked config file
            });

            afterEach(function () {
                mockFs.restore();
            });

            it('should drop cache if any makefile has mtime different from cached mtime for this file', function () {
                cacheStorage.get.withArgs(':make', 'makefiles').returns({
                    '/path/to/project/.enb/make.js': new Date(2).valueOf()
                });

                makePlatform.loadCache();

                expect(cacheStorage.drop).to.be.called;
            });
        });
    });

    describe('saveCache', function () {
        it('should save mode', function () {
            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'mode', 'mode');
        });

        it('should save enb version', function () {
            var version = require('../../../package.json').version;

            makePlatform.saveCache();

            expect(cacheStorage.set).to.be.calledWith(':make', 'version', version);
        });

        it('should save makefile mtimes', function () {
            makePlatform.saveCache();

            //no mtimes because initialized with config function
            expect(cacheStorage.set).to.be.calledWith(':make', 'makefiles', {});
        });

        it('should write cached data to disk', function () {
            makePlatform.saveCache();

            expect(cacheStorage.save).to.be.called;
        });
    });

    //skipped tests for cache attrs saving because they will be duplicated with saveCache
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
