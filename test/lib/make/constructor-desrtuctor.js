var fs = require('fs');
var MakePlatform = require('../../../lib/make');
var ProjectConfig = require('../../../lib/config/project-config');
var Node = require('../../../lib/node');
var CacheStorage = require('../../../lib/cache/cache-storage');
var Cache = require('../../../lib/cache/cache');
var SharedResources = require('../../../lib/shared-resources');

describe('make/constructor-destructor', function () {
    var makePlatform;

    beforeEach(function () {
        makePlatform = new MakePlatform();
    });

    describe('constructor', function () {
        it('should create container for env variables', function () {
            expect(makePlatform.getEnv()).to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for shared resources', function () {
            expect(makePlatform.getSharedResources()).to.be.instanceOf(SharedResources);
        });
    });

    describe('destructor', function () {
        it('should destroy shared resources', function () {
            var destruct = sinon.stub(makePlatform.getSharedResources(), 'destruct');

            makePlatform.destruct();

            expect(destruct).to.be.called;
        });

        it('should delete reference to project config', function () {
            makePlatform.destruct();

            expect(makePlatform.getProjectConfig()).to.be.undefined;
        });

        it('should drop cache storage', function () {
            var cacheStorage = sinon.createStubInstance(CacheStorage);
            makePlatform.setCacheStorage(cacheStorage);

            makePlatform.destruct();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should delete reference to cache storage', function () {
            makePlatform.setCacheStorage(sinon.createStubInstance(CacheStorage));

            makePlatform.destruct();

            expect(makePlatform.getCacheStorage()).to.be.undefined;
        });

        describe('cache destruct', function () {
            before(function () {
                sinon.sandbox.stub(Cache.prototype);
            });

            after(function () {
                sinon.sandbox.restore();
            });

            it('should destroy cache', function () {
                makePlatform.buildTargets(); //creates cache internally

                makePlatform.destruct();

                expect(Cache.prototype.destruct).to.be.called;
            });
        });

        describe('tests require node init', function () {
            var sandbox = sinon.sandbox.create();

            beforeEach(function () {
                sandbox.stub(fs);
                sandbox.stub(Node.prototype);
                sandbox.stub(ProjectConfig.prototype);

                fs.existsSync.returns(true);

                makePlatform.init('path/to/project', null, function () {});
                makePlatform.initNode('path/to/node');
            });

            afterEach(function () {
                sandbox.restore();
            });

            it('must destroy all nodes', function () {
                makePlatform.destruct();

                expect(Node.prototype.destruct).to.be.called;
            });

            it('should delete level naming schemes', function () {
                ProjectConfig.prototype.getLevelNamingSchemes.returns({ foo: { bar: 'baz' } });

                makePlatform.destruct();

                expect(function () { makePlatform.getLevelNamingScheme('foo'); })
                    .to.throw();
            });
        });
    });
});
