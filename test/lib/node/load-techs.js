'use strict';

const path = require('path');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const BaseTech = require('../../../lib/tech/base-tech');

describe('node/loadTechs', function () {
    let node;
    let tech;

    beforeEach(function () {
        const nodePath = path.join('path', 'to', 'node');
        const projectDir = path.join('path', 'to', 'project');

        const makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        tech = sinon.createStubInstance(BaseTech);
        tech.getTargets.returns(['node.js']);
        tech.getName.returns('tech');

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTechs([tech]);
    });

    it('should init registered techs', function () {
        node.loadTechs();

        expect(tech.init).to.be.called;
    });
});
