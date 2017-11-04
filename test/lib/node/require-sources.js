'use strict';

const vow = require('vow');
const path = require('path');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const BaseTech = require('../../../lib/tech/base-tech');
const Logger = require('../../../lib/logger');

describe('node/require sources', function () {
    const nodePath = path.join('path', 'to', 'node');
    let makePlatform;
    let node;

    beforeEach(function () {
        const projectDir = path.join('path', 'to', 'project');

        makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);
        makePlatform.requireNodeSources.returns(vow.when(['tech_result']));

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setLogger(sinon.createStubInstance(Logger));
    });

    describe('requireNodeSources', function () {
        const sourcesByNodes = {};

        beforeEach(function () {
            sourcesByNodes[nodePath] = ['?.js'];
        });

        it('should return promise', function () {
            const result = node.requireNodeSources(sourcesByNodes);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should require sources for node path passed in sourcesByNode', function () {
            return node.requireNodeSources(sourcesByNodes).then(function () {
                expect(makePlatform.requireNodeSources).to.be.calledWith(nodePath, sinon.match.any);
            });
        });

        it('should require sources requested by node', function () {
            return node.requireNodeSources(sourcesByNodes).then(function () {
                expect(makePlatform.requireNodeSources).to.be.calledWith(sinon.match.any, ['?.js']);
            });
        });

        it('should pass to promise results produced by required node', function () {
            return node.requireNodeSources(sourcesByNodes).then(function (results) {
                expect(results).to.have.property(nodePath);
                expect(results[nodePath]).to.be.instanceOf(Array)
                    .and.to.have.length(1);
                expect(results[nodePath][0]).to.be.equal('tech_result');
            });
        });
    });

    describe('requireSources', function () {
        let tech;

        beforeEach(function () {
            tech = new sinon.createStubInstance(BaseTech);
            tech.getTargets.returns(['node.js']);
            node.setTargetsToBuild(['node.js']);
            node.setTechs([tech]);
        });

        it('should return promise', function () {
            expect(node.requireSources(['?.js'])).to.be.instanceOf(vow.Promise);
        });

        it('should register targets before start requiring sources', function () {
            node.resolveTarget('node.js');

            return node.requireSources(['?.js']).then(function () {
                expect(node.hasRegisteredTarget('node.js')).to.be.true;
            });
        });

        it('should reject require sources if no one of registered techs can build required target', function () {
            return expect(node.requireSources(['?.css']))
                .to.be.rejectedWith(`There is no tech for target ${path.join(nodePath, 'node.css')}.`);
        });

        it('should start building required target if build was not already started', function () {
            node.resolveTarget('node.js');

            return node.requireSources(['?.js']).then(function () {
                expect(tech.build).to.be.called;
            });
        });

        it('should not start building required target if build already started', function () {
            node.resolveTarget('node.js');

            return node.requireSources(['?.js']).then(function () {
                tech.build.reset();
                return node.requireSources(['?.js']).then(function () {
                    expect(tech.build).to.be.not.called;
                });
            });
        });

        it('should not start building required target if tech already started', function () {
            tech.__started = true;
            node.resolveTarget('node.js');

            return node.requireSources(['?.js']).then(function () {
                expect(tech.build).to.be.not.called;
            });
        });

        it('should reject target if exception occured in tech', function () {
            const rejectTarget = sinon.spy(node, 'rejectTarget');
            const error = new Error('exception');

            tech.build.throws(error);

            return node.requireSources(['?.js']).fail(function () {
                expect(rejectTarget).to.be.calledWith('node.js', error);
            });
        });

        it('should pass exception error to fail handler of source require promise', function () {
            tech.build.throws(new Error('exception_tech_error'));

            return node.requireSources(['?.js']).fail(function (error) {
                expect(error.message).to.be.equal('exception_tech_error');
            });
        });

        it('should reject target if tech build finished unsuccessfully', function () {
            const rejectTarget = sinon.spy(node, 'rejectTarget');
            const error = new Error('reject');

            tech.build.returns(vow.reject(error));

            return node.requireSources(['?.js']).fail(function () {
                expect(rejectTarget).to.be.calledWith('node.js', error);
            });
        });

        it('should pass build fail error to fail handler of source require promise', function () {
            tech.build.returns(vow.reject(new Error('reject')));

            return node.requireSources(['?.js']).fail(function (error) {
                expect(error.message).to.be.equal('reject');
            });
        });
    });
});
