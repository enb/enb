'use strict'

const fs = require('fs');
const path = require('path');
const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');
const Node = require('../../../lib/node/node');
const MakePlatform = require('../../../lib/make');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const NodeConfig = require('../../../lib/config/node-config');
const TaskConfig = require('../../../lib/config/task-config');
const Logger = require('../../../lib/logger');

describe('make/build', function () {
    let makePlatform;
    const sandbox = sinon.sandbox.create();

    beforeEach(function (done) {
        mockFs({});
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        sandbox.stub(fs, 'existsSync').returns(true);
        vowFs.makeDir.returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {}).then(done);
        makePlatform.setLogger(sinon.createStubInstance(Logger));
    });

    afterEach(function () {
        mockFs.restore();
        sandbox.restore();
    });

    it('should return promise', function () {
        const result = makePlatform.build([]);

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should build task if target provided and task config available in project config', function () {
        const buildTask = sinon.spy(makePlatform, 'buildTask');

        setup({ nodePath: 'path/to/node' });
        ProjectConfig.prototype.getTaskConfig
            .returns(sinon.createStubInstance(TaskConfig));

        makePlatform.build(['path/to/node']);

        expect(buildTask).to.be.called;
    });

    it('should pass to building task target and args', function () {
        const buildTask = sinon.spy(makePlatform, 'buildTask');

        setup({ nodePath: 'path/to/node' });
        ProjectConfig.prototype.getTaskConfig
            .returns(sinon.createStubInstance(TaskConfig));

        makePlatform.build(['path/to/node', 'foo', 'bar']);

        expect(buildTask).to.be.calledWith(path.normalize('path/to/node'), ['foo', 'bar']);
    });

    it('should build targets if no taskConfig available in project config for target', function () {
        const buildTargets = sinon.spy(makePlatform, 'buildTargets');

        setup({ nodePath: 'path/to/node' });
        ProjectConfig.prototype.getTaskConfig.returns(null);

        makePlatform.build(['path/to/node']);

        expect(buildTargets).to.be.calledWith([path.normalize('path/to/node')]);
    });

    it('should build targets if no info about targets to build passed', function () {
        const buildTargets = sinon.spy(makePlatform, 'buildTargets');

        setup();
        makePlatform.build([]);

        expect(buildTargets).to.be.calledWith([]);
    });

    it('should return rejected promise if exception occured during build', function () {
        setup();
        Node.prototype.build.throws(new Error('test_err'));

        return expect(makePlatform.build([])).to.be.rejectedWith('test_err');
    });

    it('should return rejected promise if node build failed', function () {
        setup();
        Node.prototype.build.returns(vow.reject(new Error('test_err')));

        return expect(makePlatform.build([])).to.be.rejectedWith('test_err');
    });

    it('should disable logger for each node', function () {
        setup();

        return makePlatform.build([]).then(function () {
            expect(Node.prototype.getLogger().setEnabled).to.be.calledOnce
                .and.to.be.calledWith(false);
        });
    });
});

function setup (settings) {
    const nodeConfigs = {};
    const defaults = { nodePath: 'default/path' };

    settings = Object.assign({}, defaults, settings);

    nodeConfigs[settings.nodePath] = sinon.createStubInstance(NodeConfig);

    ProjectConfig.prototype.getNodeConfig
        .withArgs(settings.nodePath).returns(sinon.createStubInstance(NodeConfig));
    ProjectConfig.prototype.getNodeConfigs
        .returns(nodeConfigs);
    ProjectConfig.prototype.getNodeMaskConfigs
        .withArgs(settings.nodePath).returns([sinon.createStubInstance(NodeMaskConfig)]);

    Node.prototype.build.returns({});
    Node.prototype.getLogger.returns(sinon.createStubInstance(Logger));
}
