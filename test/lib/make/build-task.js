var fs = require('fs');
var vow = require('vow');
var vowFs = require('vow-fs');
var _ = require('lodash');
var MakePlatform = require('../../../lib/make');
var Node = require('../../../lib/node');
var ProjectConfig = require('../../../lib/config/project-config');
var TaskConfig = require('../../../lib/config/task-config');

describe('make/buildTask', function () {
    var makePlatform;
    var sandbox = sinon.sandbox.create();

    beforeEach(function (done) {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {}).then(done);
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        setup({ taskName: 'test_task' });

        expect(makePlatform.buildTask('test_task'))
            .to.be.instanceOf(vow.Promise);
    });

    it('should throw if no task config available in project config for specified task', function () {
        setup({ taskName: 'task_name' });

        expect(function () { makePlatform.buildTask('another_task'); }).to.throw;
    });

    it('should pass make platform to task config', function () {
        var taskConfig = sinon.createStubInstance(TaskConfig);

        setup({
            taskName: 'test_task',
            task: taskConfig
        });
        makePlatform.buildTask('test_task');

        expect(taskConfig.setMakePlatform).to.be.calledWith(makePlatform);
    });

    it('should execute task', function () {
        var taskConfig = sinon.createStubInstance(TaskConfig);

        setup({
            taskName: 'test_task',
            task: taskConfig
        });

        return makePlatform.buildTask('test_task').then(function () {
            expect(taskConfig.exec).to.be.called;
        });
    });

    it('should pass args to task config on exec', function () {
        var taskConfig = sinon.createStubInstance(TaskConfig);

        setup({
            taskName: 'test_task',
            task: taskConfig
        });

        return makePlatform.buildTask('test_task', ['foo', 'bar']).then(function () {
            expect(taskConfig.exec).to.be.calledWith(['foo', 'bar']);
        });
    });
});

function setup(settings) {
    settings = settings || {};

    _.defaults(settings, {
        taskName: 'default_task',
        task: sinon.createStubInstance(TaskConfig)
    });

    ProjectConfig.prototype.getTaskConfig
        .withArgs(settings.taskName).returns(settings.task);
}
