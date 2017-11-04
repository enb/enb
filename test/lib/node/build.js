'use strict'

const path = require('path');
const vow = require('vow');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const BaseTech = require('../../../lib/tech/base-tech');
const Logger = require('../../../lib/logger');

describe('node/build', function () {
    const nodePath = path.join('path', 'to', 'node');
    let node;

    beforeEach(function () {
        const tech = sinon.createStubInstance(BaseTech);
        tech.getTargets.returns(['node.js']);

        const makePlatform = sinon.createStubInstance(MakePlatform);
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
        const requireSources = sinon.spy(node, 'requireSources');

        node.resolveTarget('node.js');

        return node.build(['node.js']).then(function () {
            expect(requireSources).to.be.calledWith(['node.js']);
        });
    });

    it('should fulfill promise with paths to built targets', function () {
        const targetPath = path.join(nodePath, 'node.js');

        node.resolveTarget('node.js');

        return node.build(['node.js']).then(function (result) {
            expect(result).to.have.property('builtTargets');
            expect(result.builtTargets).to.be.instanceOf(Array)
                .and.to.have.length(1)
                .and.to.contain(targetPath);
        });
    });
});
