'use strict'

var path = require('path');
var vow = require('vow');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var BaseTech = require('../../../lib/tech/base-tech');
var Logger = require('../../../lib/logger');

describe('node/build', function () {
    var nodePath = path.join('path', 'to', 'node');
    var node;

    beforeEach(function () {
        var tech = sinon.createStubInstance(BaseTech);
        tech.getTargets.returns(['node.js']);

        var makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(path.join('path', 'to', 'project'));

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTargetsToBuild(['node.js']);
        node.setTechs([tech]);
        node.setLogger(sinon.createStubInstance(Logger));
    });

    it('should return promise', function () {
        expect(node.build(['node.js'])).to.be.instanceOf(vow.Promise);
    });

    it('should register targets before initiating build', function () {
        node.resolveTarget('node.js');

        return node.build(['node.js']).then(function () {
            expect(node.hasRegisteredTarget('node.js')).to.be.true;
        });
    });

    it('should require sources for targets to build', function () {
        var requireSources = sinon.spy(node, 'requireSources');

        node.resolveTarget('node.js');

        return node.build(['node.js']).then(function () {
            expect(requireSources).to.be.calledWith(['node.js']);
        });
    });

    it('should fulfill promise with paths to built targets', function () {
        var targetPath = path.join(nodePath, 'node.js');

        node.resolveTarget('node.js');

        return node.build(['node.js']).then(function (result) {
            expect(result).to.have.property('builtTargets');
            expect(result.builtTargets).to.be.instanceOf(Array)
                .and.to.have.length(1)
                .and.to.contain(targetPath);
        });
    });
});
