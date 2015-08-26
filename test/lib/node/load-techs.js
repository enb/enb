var path = require('path');
var vow = require('vow');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var BaseTech = require('../../../lib/tech/base-tech');
var BuildGraph = require('../../../lib/ui/build-graph');

describe('node/loadTechs', function () {
    var node;
    var tech;

    beforeEach(function () {
        var nodePath = path.join('path', 'to', 'node');
        var projectDir = path.join('path', 'to', 'project');

        var makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        tech = sinon.createStubInstance(BaseTech);
        tech.getTargets.returns(['node.js']);
        tech.getName.returns('tech');

        node = new Node(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTechs([tech]);
    });

    it('should return promise', function () {
        expect(node.loadTechs()).to.be.instanceOf(vow.Promise);
    });

    it('should init registered techs', function () {
        return node.loadTechs().then(function () {
            expect(tech.init).to.be.called;
        });
    });

    it('should add targets to build graph if graph is being set', function () {
        var buildGraph = sinon.createStubInstance(BuildGraph);
        var expectedTargetPath = path.join('path', 'to', 'node', 'node.js');
        node.setBuildGraph(buildGraph);

        return node.loadTechs().then(function () {
            expect(buildGraph.addTarget).to.be.calledWith(expectedTargetPath, 'tech');
        });
    });
});
