'use strict'

const path = require('path');
const vow = require('vow');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const BaseTech = require('../../../lib/tech/base-tech');

describe('node/cleanup', function () {
    let node;
    let tech;

    beforeEach(function () {
        const nodePath = path.join('path', 'to', 'node');
        const projectDir = path.join('path', 'to', 'project');

        const makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        tech = sinon.createStubInstance(BaseTech);
        tech.clean.returns(vow.fulfill);
        tech.getTargets.returns(['node.js']);

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTargetsToBuild(['node.js']);
        node.setTechs([tech]);
    });

    describe('cleanTargets', function () {
        beforeEach(function (done) {
            // no public method for registering targets available, clean does registering targets inside
            node.clean().then(function () {
                done();
            });
        });

        it('should return promise', function () {
            const result = node.cleanTargets(['node.js']);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should throw error if no tech registered for passed target', function () {
            expect(function () { node.cleanTargets(['node.css']); })
                .to.throw('There is no tech for target node.css');
        });

        it('should call clean for techs associated with target', function () {
            tech.clean.reset(); // reset because clean is being called in constructor

            return node.cleanTargets(['node.js']).then(function  () {
                expect(tech.clean).to.be.calledOnce;
            });
        });
    });

    describe('clean', function () {
        it('should return promise', function () {
            const result = node.clean(['node.js']);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should register node targets before initiating clean', function () {
            return node.clean(['node.js']).then(function () {
                expect(node.hasRegisteredTarget('node.js')).to.be.true;
            });
        });

        it('should initiate clean for resolved targets', function () {
            const cleanTargets = sinon.spy(node, 'cleanTargets');

            return node.clean(['node.js']).then(function () {
                expect(cleanTargets).to.be.called;
            });
        });
    });
});
