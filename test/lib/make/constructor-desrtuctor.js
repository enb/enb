'use strict'

var fs = require('fs');
var vow = require('vow');
var vfs = require('vow-fs');
var mockFs = require('mock-fs');
var MakePlatform = require('../../../lib/make');
var ProjectConfig = require('../../../lib/config/project-config');
var Node = require('../../../lib/node/node');
var CacheStorage = require('../../../lib/cache/cache-storage');
var Cache = require('../../../lib/cache/cache');
var SharedResources = require('../../../lib/shared-resources');

describe('make/constructor-destructor', function () {
    var sandbox = sinon.sandbox.create();
    var makePlatform;

    beforeEach(function () {
        mockFs({});
        makePlatform = new MakePlatform();
    });

    afterEach(function () {
        mockFs.restore();
        sandbox.restore();
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
            sandbox.stub(SharedResources.prototype);

            makePlatform.destruct();

            expect(SharedResources.prototype.destruct).to.be.called;
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

        it('should destroy cache', function () {
            sandbox.stub(Cache.prototype);

            makePlatform.buildTargets(); // creates cache internally

            makePlatform.destruct();

            expect(Cache.prototype.destruct).to.be.called;
        });

        describe('tests require node init', function () {
            beforeEach(function () {
                mockFs({});

                sandbox.stub(Node.prototype);
                sandbox.stub(ProjectConfig.prototype);

                sandbox.stub(fs, 'existsSync').returns(true);
                sandbox.stub(vfs, 'makeDir').returns(vow.resolve());

                makePlatform.init('path/to/project', null, function () {});
                makePlatform.initNode('path/to/node');
            });

            afterEach(function () {
                mockFs.restore();
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
