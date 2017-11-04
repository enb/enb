'use strict'

const fs = require('fs');

const vow = require('vow');
const vfs = require('vow-fs');
const mockFs = require('mock-fs');

const MakePlatform = require('../../../lib/make');
const ProjectConfig = require('../../../lib/config/project-config');
const Node = require('../../../lib/node/node');
const CacheStorage = require('../../../lib/cache/cache-storage');
const Cache = require('../../../lib/cache/cache');
const SharedResources = require('../../../lib/shared-resources');

describe('make/constructor-destructor', () => {
    const sandbox = sinon.sandbox.create();
    let makePlatform;

    beforeEach(() => {
        mockFs({});
        makePlatform = new MakePlatform();
    });

    afterEach(() => {
        mockFs.restore();
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create container for env variables', () => {
            expect(makePlatform.getEnv()).to.be.instanceOf(Object)
                .and.to.be.empty;
        });

        it('should create container for shared resources', () => {
            expect(makePlatform.getSharedResources()).to.be.instanceOf(SharedResources);
        });
    });

    describe('destructor', () => {
        it('should destroy shared resources', () => {
            sandbox.stub(SharedResources.prototype);

            makePlatform.destruct();

            expect(SharedResources.prototype.destruct).to.be.called;
        });

        it('should delete reference to project config', () => {
            makePlatform.destruct();

            expect(makePlatform.getProjectConfig()).to.be.undefined;
        });

        it('should drop cache storage', () => {
            const cacheStorage = sinon.createStubInstance(CacheStorage);
            makePlatform.setCacheStorage(cacheStorage);

            makePlatform.destruct();

            expect(cacheStorage.drop).to.be.called;
        });

        it('should delete reference to cache storage', () => {
            makePlatform.setCacheStorage(sinon.createStubInstance(CacheStorage));

            makePlatform.destruct();

            expect(makePlatform.getCacheStorage()).to.be.undefined;
        });

        it('should destroy cache', () => {
            sandbox.stub(Cache.prototype);

            makePlatform.buildTargets(); // creates cache internally

            makePlatform.destruct();

            expect(Cache.prototype.destruct).to.be.called;
        });

        describe('tests require node init', () => {
            beforeEach(() => {
                mockFs({});

                sandbox.stub(Node.prototype);
                sandbox.stub(ProjectConfig.prototype);

                sandbox.stub(fs, 'existsSync').returns(true);
                sandbox.stub(vfs, 'makeDir').returns(vow.resolve());

                makePlatform.init('path/to/project', null, () => {});
                makePlatform.initNode('path/to/node');
            });

            afterEach(() => {
                mockFs.restore();
                sandbox.restore();
            });

            it('must destroy all nodes', () => {
                makePlatform.destruct();

                expect(Node.prototype.destruct).to.be.called;
            });

            it('should delete level naming schemes', () => {
                ProjectConfig.prototype.getLevelNamingSchemes.returns({ foo: { bar: 'baz' } });

                makePlatform.destruct();

                expect(() => { makePlatform.getLevelNamingScheme('foo'); })
                    .to.throw();
            });
        });
    });
});
