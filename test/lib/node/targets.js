'use strict';

const path = require('path');

const vow = require('vow');
const mockFs = require('mock-fs');

const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const Logger = require('../../../lib/logger');
const BaseTech = require('../../../lib/tech/base-tech');

describe('node/targets', () => {
    let node;
    let tech;
    let logger;

    beforeEach(() => {
        mockFs({});

        const nodePath = path.join('path', 'to', 'node');
        const projectDir = path.join('path', 'to', 'project');

        const makePlatform = sinon.createStubInstance(MakePlatform);
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

    afterEach(() => {
        mockFs.restore();
    });

    describe('methods require registered target before test', () => {
        beforeEach(() => {
            node.resolveTarget('node.js');
        });

        describe('hasRegisteredTarget', () => {
            it('should return true if node has registered target', () => {
                expect(node.hasRegisteredTarget('node.js')).to.be.true;
            });
        });

        describe('getTargetName', () => {
            it('should return target name without suffix if suffix was not passed', () => {
                expect(node.getTargetName()).to.be.equal('node');
            });

            it('should return target name with suffix if suffix was passed', () => {
                expect(node.getTargetName('js')).to.be.equal('node.js');
            });
        });

        describe('unmaskTargetName', () => {
            it('should replace ? symbols with target name for provided masked target name', () => {
                expect(node.unmaskTargetName('?.js')).to.be.equal('node.js');
            });
        });

        describe('isValidTarget', () => {
            it('should log target is valid', () => {
                node.isValidTarget('node.js');

                // not checking target name logged because tech not registered
                expect(logger.isValid).to.be.calledWith('node.js');
            });

            it('should mark registered target valid', () => {
                logger.logAction.reset();

                node.isValidTarget('node.js');
                node.resolveTarget('node.js');

                expect(logger.logAction).to.be.not.called;
            });
        });
    });

    describe('resolveTarget', () => {
        it('should return promise', () => {
            expect(node.resolveTarget('node.js')).to.be.instanceOf(vow.Promise);
        });

        it('should fulfill target execution promise with value passed to resolveTarget', () => {
            expect(node.resolveTarget('node.js', 'test_value')).to.be.eventually.equal('test_value')
        });

        it('should log rebuild action if target was not marked valid', () => {
            node.resolveTarget('node.js');

            // not checking target name logged because tech not registered
            expect(logger.logAction).to.be.calledWith('rebuild', 'node.js');
        });
    });

    describe('rejectTarget', () => {
        const error = new Error('test_error');

        it('should log node failed to build target', () => {
            node.rejectTarget('node.js', error);

            // not checking target name logged because tech not registered
            expect(logger.logErrorAction).to.be.calledWith('failed', 'node.js');
        });

        it('should return promise', () => {
            expect(node.rejectTarget('node.js', error)).to.be.instanceOf(vow.Promise);
        });

        it('should return rejected promise with error passed to rejectTarget', () => {
            expect(node.rejectTarget('node.js', error)).to.be.rejectedWith(error);
        });
    });
});
