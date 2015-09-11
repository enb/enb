var path = require('path');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var Logger = require('../../../lib/logger');
var BaseTech = require('../../../lib/tech/base-tech');

describe('node', function () {
    describe('accessors', function () {
        var nodePath = path.join('path', 'to', 'node');
        var projectDir = path.join('path', 'to', 'project');
        var makePlatform;
        var nodeCache;
        var cache;
        var node;

        beforeEach(function () {
            makePlatform = sinon.createStubInstance(MakePlatform);
            makePlatform.getDir.returns(projectDir);
            cache = sinon.createStubInstance(Cache);
            nodeCache = sinon.createStubInstance(Cache);
            nodeCache.subCache.returns(sinon.createStubInstance(Cache));
            cache.subCache.returns(nodeCache);
            node = nodeFactory.mkNode(nodePath, makePlatform, cache);
        });

        describe('setBuildState', function () {
            it('should set build state', function () {
                node.setBuildState({ foo: 'bar' });

                expect(node.buildState).to.be.deep.equal({ foo: 'bar' });
            });

            it('should overwrite previous build state', function () {
                node.setBuildState({ foo: 'bar' });
                node.setBuildState({ bar: 'baz' });

                expect(node.buildState).to.be.deep.equal({ bar: 'baz' });
            });
        });

        describe('setLogger', function () {
            var logger;

            beforeEach(function () {
                logger = sinon.createStubInstance(Logger);
            });

            it('should set logger', function () {
                node.setLogger(logger);

                expect(node.getLogger()).to.be.equal(logger);
            });

            it('should support method chaining pattern', function () {
                expect(node.setLogger(logger)).to.be.equal(node);
            });
        });

        describe('setLanguages', function () {
            var languages = ['en', 'ru'];

            it('should set languages', function () {
                node.setLanguages(languages);

                expect(node.getLanguages()).to.be.equal(languages);
            });

            it('should support method chaining pattern', function () {
                expect(node.setLanguages()).to.be.equal(node);
            });
        });

        describe('getDir', function () {
            it('should return absolute path to node dir', function () {
                var expectedPath = path.resolve(projectDir, nodePath);

                expect(node.getDir()).to.be.equal(expectedPath);
            });
        });

        describe('getRootDir', function () {
            it('should return project root dir', function () {
                expect(node.getRootDir()).to.be.equal(projectDir);
            });
        });

        describe('getPath', function () {
            it('should return node path relative to project root', function () {
                expect(node.getPath()).to.be.equal(nodePath);
            });
        });

        describe('getTechs', function () {
            var baseTech = sinon.createStubInstance(BaseTech);
            var techs = [baseTech];

            it('should return previously registered techs', function () {
                node.setTechs(techs);

                expect(node.getTechs()).to.be.instanceOf(Array)
                    .and.to.have.length(1)
                    .and.to.contain(baseTech);
            });

            it('should return empty array if no techs were registered', function () {
                expect(node.getTechs()).to.be.instanceOf(Array)
                    .and.to.be.empty;
            });
        });

        describe('getNodeCache', function () {
            it('should return node cache if subcache name is not provided', function () {
                expect(node.getNodeCache()).to.be.deep.equal(cache.subCache());
            });

            it('should return subcache of node cache if subcache name provided', function () {
                var expectedCache = nodeCache.subCache('name');

                expect(node.getNodeCache('name')).to.be.deep.equal(expectedCache);
            });
        });

        describe('getLevelNamingScheme', function () {
            it('should return level naming scheme from make platform', function () {
                node.getLevelNamingScheme('level/path');

                expect(makePlatform.getLevelNamingScheme).to.be.calledWith('level/path');
            });
        });

        describe('getSharedResources', function () {
            it('should return shared resources from make platform', function () {
                node.getSharedResources();

                expect(makePlatform.getSharedResources).to.be.called;
            });
        });
    });
});
