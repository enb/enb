var path = require('path');
var vow = require('vow');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var BaseTech = require('../../../lib/tech/base-tech');

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

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
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
});
