var path = require('path');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var BuildGraph = require('../../../lib/ui/build-graph');
var Logger = require('../../../lib/logger');

describe('node/constructor and destructor', function () {
    var nodePath = path.join('path', 'to', 'node');
    var projectDir = path.join('path', 'to', 'project');
    var cache;
    var makePlatform;
    var node;

    beforeEach(function () {
        cache = sinon.createStubInstance(Cache);
        cache.subCache.returns(sinon.createStubInstance(Cache));

        makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        node = new Node(nodePath, makePlatform, cache);
    });

    describe('constructor', function () {
        it('should set relative node path', function () {
            expect(node.getPath()).to.be.equal(nodePath);
        });

        it('should set absolute path to project received from make-platform', function () {
            expect(node.getRootDir()).to.be.equal(makePlatform.getDir());
        });

        it('should set absolute path to node dir', function () {
            var expectedPath = path.resolve(projectDir, nodePath);

            expect(node.getDir()).to.be.equal(expectedPath);
        });

        it('should set target name as name of node directory', function () {
            var ext = 'ext';
            var expectedName = [path.basename(nodePath), ext].join('.');

            expect(node.getTargetName(ext)).be.equal(expectedName);
        });

        it('should create container for techs', function () {
            expect(node.getTechs()).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should create cache for node', function () {
            var expectedCache = cache.subCache(nodePath);

            expect(node.getNodeCache()).to.be.deep.equal(expectedCache);
        });
    });

    describe('destruct', function () {
        it('should delete reference to make platform', function () {
            node.destruct();

            expect(node.getLevelNamingScheme).to.throw(); //level naming scheme returned from make platform
        });

        it('should call destruct of node cache', function () {
            node.destruct();

            expect(cache.subCache().destruct).to.be.called;
        });

        it('should delete reference to node cache', function () {
            node.destruct();

            expect(node.getNodeCache()).to.be.undefined;
        });

        it('should delete reference to techs', function () {
            node.destruct();

            expect(node.getTechs()).to.be.undefined;
        });

        it('should delete reference to build graph', function () {
            var graph = sinon.createStubInstance(BuildGraph);
            node.setBuildGraph(graph);
            node.setLogger(sinon.createStubInstance(Logger));

            node.destruct();

            return node.resolveTarget('node.js').then(function () {
                expect(graph.resolveTarget).to.be.not.called;
            });
        });
    });
});
