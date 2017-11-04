'use strict'

const path = require('path');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const Logger = require('../../../lib/logger');
const BaseTech = require('../../../lib/tech/base-tech');

describe('node', () => {
    describe('accessors', () => {
        const nodePath = path.join('path', 'to', 'node');
        const projectDir = path.join('path', 'to', 'project');
        let makePlatform;
        let nodeCache;
        let cache;
        let node;

        beforeEach(() => {
            makePlatform = sinon.createStubInstance(MakePlatform);
            makePlatform.getDir.returns(projectDir);
            cache = sinon.createStubInstance(Cache);
            nodeCache = sinon.createStubInstance(Cache);
            nodeCache.subCache.returns(sinon.createStubInstance(Cache));
            cache.subCache.returns(nodeCache);
            node = nodeFactory.mkNode(nodePath, makePlatform, cache);
        });

        describe('setBuildState', () => {
            it('should set build state', () => {
                node.setBuildState({ foo: 'bar' });

                expect(node.buildState).to.be.deep.equal({ foo: 'bar' });
            });

            it('should overwrite previous build state', () => {
                node.setBuildState({ foo: 'bar' });
                node.setBuildState({ bar: 'baz' });

                expect(node.buildState).to.be.deep.equal({ bar: 'baz' });
            });
        });

        describe('setLogger', () => {
            let logger;

            beforeEach(() => {
                logger = sinon.createStubInstance(Logger);
            });

            it('should set logger', () => {
                node.setLogger(logger);

                expect(node.getLogger()).to.be.equal(logger);
            });

            it('should support method chaining pattern', () => {
                expect(node.setLogger(logger)).to.be.equal(node);
            });
        });

        describe('setLanguages', () => {
            const languages = ['en', 'ru'];

            it('should set languages', () => {
                node.setLanguages(languages);

                expect(node.getLanguages()).to.be.equal(languages);
            });

            it('should support method chaining pattern', () => {
                expect(node.setLanguages()).to.be.equal(node);
            });
        });

        describe('getDir', () => {
            it('should return absolute path to node dir', () => {
                const expectedPath = path.resolve(projectDir, nodePath);

                expect(node.getDir()).to.be.equal(expectedPath);
            });
        });

        describe('getRootDir', () => {
            it('should return project root dir', () => {
                expect(node.getRootDir()).to.be.equal(projectDir);
            });
        });

        describe('getPath', () => {
            it('should return node path relative to project root', () => {
                expect(node.getPath()).to.be.equal(nodePath);
            });
        });

        describe('getTechs', () => {
            const baseTech = sinon.createStubInstance(BaseTech);
            const techs = [baseTech];

            it('should return previously registered techs', () => {
                node.setTechs(techs);

                expect(node.getTechs()).to.be.instanceOf(Array)
                    .and.to.have.length(1)
                    .and.to.contain(baseTech);
            });

            it('should return empty array if no techs were registered', () => {
                expect(node.getTechs()).to.be.instanceOf(Array)
                    .and.to.be.empty;
            });
        });

        describe('getNodeCache', () => {
            it('should return node cache if subcache name is not provided', () => {
                expect(node.getNodeCache()).to.be.deep.equal(cache.subCache());
            });

            it('should return subcache of node cache if subcache name provided', () => {
                const expectedCache = nodeCache.subCache('name');

                expect(node.getNodeCache('name')).to.be.deep.equal(expectedCache);
            });
        });

        describe('getLevelNamingScheme', () => {
            it('should return level naming scheme from make platform', () => {
                node.getLevelNamingScheme('level/path');

                expect(makePlatform.getLevelNamingScheme).to.be.calledWith('level/path');
            });
        });

        describe('getSharedResources', () => {
            it('should return shared resources from make platform', () => {
                node.getSharedResources();

                expect(makePlatform.getSharedResources).to.be.called;
            });
        });
    });
});
