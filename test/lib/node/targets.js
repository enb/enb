var path = require('path');
var vow = require('vow');
var mockFs = require('mock-fs');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var Logger = require('../../../lib/logger');
var BaseTech = require('../../../lib/tech/base-tech');

describe('node/targets', function () {
    var node;
    var tech;
    var logger;

    beforeEach(function () {
        mockFs({});

        var nodePath = path.join('path', 'to', 'node');
        var projectDir = path.join('path', 'to', 'project');

        var makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        logger = sinon.createStubInstance(Logger);

        tech = sinon.createStubInstance(BaseTech);
        tech.getTargets.returns(['node.js']);
        tech.getName.returns('tech');

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
        node.setTargetsToBuild(['node.js']);
        node.setTechs([tech]);
        node.setLogger(logger);
    });

    afterEach(function () {
        mockFs.restore();
    });

    describe('methods require registered target before test', function () {
        beforeEach(function () {
            node.resolveTarget('node.js');
        });

        describe('hasRegisteredTarget', function () {
            it('should return true if node has registered target', function () {
                expect(node.hasRegisteredTarget('node.js')).to.be.true;
            });
        });

        describe('getTargetName', function () {
            it('should return target name without suffix if suffix was not passed', function () {
                expect(node.getTargetName()).to.be.equal('node');
            });

            it('should return target name with suffix if suffix was passed', function () {
                expect(node.getTargetName('js')).to.be.equal('node.js');
            });
        });

        describe('unmaskTargetName', function () {
            it('should replace ? symbols with target name for provided masked target name', function () {
                expect(node.unmaskTargetName('?.js')).to.be.equal('node.js');
            });
        });

        describe('isValidTarget', function () {
            it('should log target is valid', function () {
                node.isValidTarget('node.js');

                // not checking target name logged because tech not registered
                expect(logger.isValid).to.be.calledWith('node.js');
            });

            it('should mark registered target valid', function () {
                logger.logAction.reset();

                node.isValidTarget('node.js');
                node.resolveTarget('node.js');

                expect(logger.logAction).to.be.not.called;
            });
        });
    });

    describe('resolveTarget', function () {
        it('should return promise', function () {
            expect(node.resolveTarget('node.js')).to.be.instanceOf(vow.Promise);
        });

        it('should fulfill target execution promise with value passed to resolveTarget', function () {
            return expect(node.resolveTarget('node.js', 'test_value')).to.be.eventually.equal('test_value');
        });

        it('should log rebuild action if target was not marked valid', function () {
            node.resolveTarget('node.js');

            // not checking target name logged because tech not registered
            expect(logger.logAction).to.be.calledWith('rebuild', 'node.js');
        });
    });

    describe('rejectTarget', function () {
        var error = new Error('test_error');

        it('should log node failed to build target', function () {
            node.rejectTarget('node.js', error);

            // not checking target name logged because tech not registered
            expect(logger.logErrorAction).to.be.calledWith('failed', 'node.js');
        });

        it('should return promise', function () {
            expect(node.rejectTarget('node.js', error)).to.be.instanceOf(vow.Promise);
        });

        it('should return rejected promise with error passed to rejectTarget', function () {
            return expect(node.rejectTarget('node.js', error)).to.be.rejectedWith(error);
        });
    });
});
