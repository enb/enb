var vow = require('vow');
var path = require('path');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var BaseTech = require('../../../lib/tech/base-tech');
var Logger = require('../../../lib/logger');

describe('node/require sources', function () {
    var nodePath = path.join('path', 'to', 'node');
    var makePlatform;
    var node;

    beforeEach(function () {
        var projectDir = path.join('path', 'to', 'project');

        makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);
        makePlatform.requireNodeSources.returns(vow.when(['tech_result']));

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setLogger(sinon.createStubInstance(Logger));
    });

    describe('requireNodeSources', function () {
        var sourcesByNodes = {};

        beforeEach(function () {
            sourcesByNodes[nodePath] = ['?.js'];
        });

        it('should return promise', function () {
            var result = node.requireNodeSources(sourcesByNodes);

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
        var tech;

        beforeEach(function () {
            tech = new sinon.createStubInstance(BaseTech);
            tech.getTargets.returns(['node.js']);
            node.setTargetsToBuild(['node.js']);
            node.setTechs([tech]);
        });

        it('should return promise', function () {
            expect(node.requireSources('?.js')).to.be.instanceOf(vow.Promise);
        });

        it('should register targets before start requiring sources', function () {
            node.resolveTarget('node.js');

            return node.requireSources(['?.js']).then(function () {
                expect(node.hasRegisteredTarget('node.js')).to.be.true;
            });
        });

        it('should reject require sources if no one of registered techs can build required target', function () {
            return expect(node.requireSources(['?.css']))
                .to.be.rejectedWith('There is no tech for target ' + path.join(nodePath, 'node.css') + '.');
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
            var rejectTarget = sinon.spy(node, 'rejectTarget');
            tech.build.throws(new Error('exception'));

            return node.requireSources(['?.js']).fail(function () {
                expect(rejectTarget).to.be.calledWith('node.js', new Error('exception'));
            });
        });

        it('should pass exception error to fail handler of source require promise', function () {
            tech.build.throws(new Error('exception_tech_error'));

            return node.requireSources(['?.js']).fail(function (error) {
                expect(error).to.be.deep.equal(new Error('exception_tech_error'));
            });
        });

        it('should reject target if tech build finished unsuccessfully', function () {
            var rejectTarget = sinon.spy(node, 'rejectTarget');

            tech.build.returns(vow.reject(new Error('reject')));

            return node.requireSources(['?.js']).fail(function () {
                expect(rejectTarget).to.be.calledWith('node.js', new Error('reject'));
            });
        });

        it('should pass build fail error to fail handler of source require promise', function () {
            tech.build.returns(vow.reject(new Error('reject')));

            return node.requireSources(['?.js']).fail(function (error) {
                expect(error).to.be.deep.equal(new Error('reject'));
            });
        });
    });
});
