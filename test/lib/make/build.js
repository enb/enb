var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var _ = require('lodash');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var NodeConfig = require('../../../lib/config/node-config');
var TaskConfig = require('../../../lib/config/task-config');
var Logger = require('../../../lib/logger');

describe('make/build', function () {
    var makePlatform;
    var sandbox = sinon.sandbox.create();

    beforeEach(function (done) {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {}).then(function () {
            done();
        });
        makePlatform.setLogger(sinon.createStubInstance(Logger));
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        var result = makePlatform.build([]);

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should log build started message', function () {
        makePlatform.build([]);

        expect(makePlatform.getLogger().log).to.be.calledWith('build started');
    });

    it('should build task if target provided and task config available in project config', function () {
        var buildTask = sinon.spy(makePlatform, 'buildTask');

        setup({
            nodePath: 'path/to.node',
            taskConfig: sinon.createStubInstance(TaskConfig)
        });
        makePlatform.build(['path/to/node']);

        expect(buildTask).to.be.called;
    });

    it('should pass to building task target and args', function () {
        var buildTask = sinon.spy(makePlatform, 'buildTask');

        setup({
            nodePath: 'path/to.node',
            taskConfig: sinon.createStubInstance(TaskConfig)
        });
        makePlatform.build(['path/to/node', 'foo', 'bar']);

        expect(buildTask).to.be.calledWith(path.normalize('path/to/node'), ['foo', 'bar']);
    });

    it('should build targets if no taskConfig available in project config for target', function () {
        var buildTargets = sinon.spy(makePlatform, 'buildTargets');

        setup({
            nodePath: 'path/to/node',
            taskConfig: null
        });
        makePlatform.build(['path/to/node']);

        expect(buildTargets).to.be.calledWith([path.normalize('path/to/node')]);
    });

    it('should build targets if no info about targets to build passed', function () {
        var buildTargets = sinon.spy(makePlatform, 'buildTargets');

        setup({ nodePath: 'path/to.node' });
        makePlatform.build([]);

        expect(buildTargets).to.be.calledWith([]);
    });

    it('should return rejected promise if exception occured during build', function () {
        setup({
            nodePath: 'path/to.node',
            nodeBuildExc: new Error('test_err')
        });

        return expect(makePlatform.build([])).to.be.rejectedWith('test_err');
    });

    it('should return rejected promise if node build failed', function () {
        setup({
            nodePath: 'path/to/node',
            nodeBuildResult: new vow.reject(new Error('test_err'))
        });

        return expect(makePlatform.build([])).to.be.rejectedWith('test_err');
    });

    it('should log build finished message', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.build([]).then(function () {
            expect(makePlatform.getLogger().log).to.be.calledWithMatch(/build finished - \S+ms/);
        });
    });

    it('should disable logger for each node', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.build([]).then(function () {
            expect(Node.prototype.getLogger().setEnabled).to.be.calledOnce
                .and.to.be.calledWith(false);
        });
    });
});

function setup (settings) {
    var nodeConfigs = {};

    _.defaults(settings, {
        nodePath: 'path/to/node',
        taskConfig: null,
        nodeBuildResult: {},
        nodeBuildExc: null
    });

    nodeConfigs[settings.nodePath] = sinon.createStubInstance(NodeConfig);

    ProjectConfig.prototype.getNodeConfig.returns(sinon.createStubInstance(NodeConfig));
    ProjectConfig.prototype.getNodeConfigs.returns(nodeConfigs);
    ProjectConfig.prototype.getNodeMaskConfigs.returns([sinon.createStubInstance(NodeMaskConfig)]);
    ProjectConfig.prototype.getTaskConfig.returns(settings.taskConfig);

    Node.prototype.build.returns(settings.nodeBuildResult);
    settings.nodeBuildExc  && Node.prototype.build.throws(settings.nodeBuildExc);
    Node.prototype.getLogger.returns(sinon.createStubInstance(Logger));
}
