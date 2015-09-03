var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var NodeConfig = require('../../../lib/config/node-config');
var TaskConfig = require('../../../lib/config/task-config');
var Logger = require('../../../lib/logger');

describe('make/build', function () {
    var makePlatform;
    var sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function (done) {
        var fakeNodeConfigs = {};
        var nodePath = path.normalize('path/to/node');
        var fakeNodeConfig = sinon.createStubInstance(NodeConfig);

        fakeNodeConfigs[nodePath] = fakeNodeConfig;

        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        ProjectConfig.prototype.getNodeConfig.returns(fakeNodeConfig);
        ProjectConfig.prototype.getNodeConfigs.returns(fakeNodeConfigs);
        ProjectConfig.prototype.getNodeMaskConfigs.returns([sinon.createStubInstance(NodeMaskConfig)]);
        Node.prototype.build.returns({ builtTargets: ['?.js'] });
        Node.prototype.getLogger.returns(sinon.createStubInstance(Logger));

        makePlatform = new MakePlatform();
        makePlatform.init(path.normalize('/path/to/project'), 'mode', function () {}).then(function () {
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

    it('should convert unix-style target path to win-style on win', function () {
        var buildTargets = sinon.spy(makePlatform, 'buildTargets');

        return makePlatform.build(['path/to/node']).then(function () {
            expect(buildTargets).to.be.calledWith([path.normalize('path/to/node')]);
        });
    });

    it('should build task instea if target provided and task config available in project config', function () {
        var buildTask = sinon.spy(makePlatform, 'buildTask');
        ProjectConfig.prototype.getTaskConfig.returns(sinon.createStubInstance(TaskConfig));

        makePlatform.build([path.normalize('path/to/node')]);

        expect(buildTask).to.be.called;

    });

    it('should pass to building task target and args', function () {
        var buildTask = sinon.spy(makePlatform, 'buildTask');
        ProjectConfig.prototype.getTaskConfig.returns(sinon.createStubInstance(TaskConfig));

        makePlatform.build([path.normalize('path/to/node'), 'foo', 'bar']);

        expect(buildTask).to.be.calledWith(path.normalize('path/to/node'), ['foo', 'bar']);
    });

    it('should build targets if no taskConfig available in project config for target', function () {
        var buildTargets = sinon.spy(makePlatform, 'buildTargets');

        makePlatform.build([path.normalize('path/to/node')]);

        expect(buildTargets).to.be.calledWith([path.normalize('path/to/node')]);
    });

    it('should build targets if no info about targets to build passed', function () {
        var buildTargets = sinon.spy(makePlatform, 'buildTargets');

        makePlatform.build([]);

        expect(buildTargets).to.be.calledWith([]);
    });

    it('should return rejected promise if exception occured during build', function () {
        Node.prototype.build.throws('test_err');

        return expect(makePlatform.build([])).to.be.rejectedWith('test_err');
    });

    it('should return rejected promise if node build failed', function () {
        Node.prototype.build.returns(vow.reject('test_err'));

        return expect(makePlatform.build([])).to.be.rejectedWith('test_err');
    });

    it('should log build finished message', function () {
        return makePlatform.build([]).then(function () {
            expect(makePlatform.getLogger().log).to.be.calledWithMatch(/build finished - \S+ms/);
        });
    });

    it('should disable logger for each node', function () {
        return makePlatform.build([]).then(function () {
            expect(Node.prototype.getLogger().setEnabled).to.be.calledOnce
                .and.to.be.calledWith(false);
        });
    });
});
