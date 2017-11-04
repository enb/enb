'use strict'

const path = require('path');
const vow = require('vow');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const BaseTech = require('../../../lib/tech/base-tech');
const Logger = require('../../../lib/logger');

describe('node/build', () => {
    const nodePath = path.join('path', 'to', 'node');
    let node;

    beforeEach(() => {
        const tech = sinon.createStubInstance(BaseTech);
        tech.getTargets.returns(['node.js']);

        const makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(path.join('path', 'to', 'project'));

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTargetsToBuild(['node.js']);
        node.setTechs([tech]);
        node.setLogger(sinon.createStubInstance(Logger));
    });

    it('should return promise', () => {
        expect(node.build(['node.js'])).to.be.instanceOf(vow.Promise);
    });

    it('should register targets before initiating build', () => {
        node.resolveTarget('node.js');

        return node.build(['node.js']).then(() => {
            expect(node.hasRegisteredTarget('node.js')).to.be.true;
        });
    });

    it('should require sources for targets to build', () => {
        const requireSources = sinon.spy(node, 'requireSources');

        node.resolveTarget('node.js');

        return node.build(['node.js']).then(() => {
            expect(requireSources).to.be.calledWith(['node.js']);
        });
    });

    it('should fulfill promise with paths to built targets', () => {
        const targetPath = path.join(nodePath, 'node.js');

        node.resolveTarget('node.js');

        return node.build(['node.js']).then(result => {
            expect(result).to.have.property('builtTargets');
            expect(result.builtTargets).to.be.instanceOf(Array)
                .and.to.have.length(1)
                .and.to.contain(targetPath);
        });
    });
});
