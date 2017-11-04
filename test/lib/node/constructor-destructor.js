'use strict';

const path = require('path');

const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');

describe('node/constructor and destructor', () => {
    const nodePath = path.join('path', 'to', 'node');
    const projectDir = path.join('path', 'to', 'project');
    let cache;
    let makePlatform;
    let node;

    beforeEach(() => {
        cache = sinon.createStubInstance(Cache);
        cache.subCache.returns(sinon.createStubInstance(Cache));

        makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        node = nodeFactory.mkNode(nodePath, makePlatform, cache);
    });

    describe('constructor', () => {
        it('should set relative node path', () => {
            expect(node.getPath()).to.be.equal(nodePath);
        });

        it('should set absolute path to project received from make-platform', () => {
            expect(node.getRootDir()).to.be.equal(makePlatform.getDir());
        });

        it('should set absolute path to node dir', () => {
            const expectedPath = path.resolve(projectDir, nodePath);

            expect(node.getDir()).to.be.equal(expectedPath);
        });

        it('should set target name as name of node directory', () => {
            const ext = 'ext';
            const expectedName = [path.basename(nodePath), ext].join('.');

            expect(node.getTargetName(ext)).be.equal(expectedName);
        });

        it('should create container for techs', () => {
            expect(node.getTechs()).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should create cache for node', () => {
            const expectedCache = cache.subCache(nodePath);

            expect(node.getNodeCache()).to.be.deep.equal(expectedCache);
        });
    });

    describe('destruct', () => {
        it('should delete reference to make platform', () => {
            node.destruct();

            expect(node.getLevelNamingScheme).to.throw(); // level naming scheme returned from make platform
        });

        it('should call destruct of node cache', () => {
            node.destruct();

            expect(cache.subCache().destruct).to.be.called;
        });

        it('should delete reference to node cache', () => {
            node.destruct();

            expect(node.getNodeCache()).to.be.undefined;
        });

        it('should delete reference to techs', () => {
            node.destruct();

            expect(node.getTechs()).to.be.undefined;
        });
    });
});
