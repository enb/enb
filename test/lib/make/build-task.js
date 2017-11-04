'use strict'

const fs = require('fs');
const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');
const MakePlatform = require('../../../lib/make');
const Node = require('../../../lib/node');
const ProjectConfig = require('../../../lib/config/project-config');
const TaskConfig = require('../../../lib/config/task-config');

describe('make/buildTask', function () {
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
    });

    afterEach(function () {
        mockFs.restore();
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
        const taskConfig = sinon.createStubInstance(TaskConfig);

        setup({
            taskName: 'test_task',
            task: taskConfig
        });
        makePlatform.buildTask('test_task');

        expect(taskConfig.setMakePlatform).to.be.calledWith(makePlatform);
    });

    it('should execute task', function () {
        const taskConfig = sinon.createStubInstance(TaskConfig);

        setup({
            taskName: 'test_task',
            task: taskConfig
        });

        return makePlatform.buildTask('test_task').then(function () {
            expect(taskConfig.exec).to.be.called;
        });
    });

    it('should pass args to task config on exec', function () {
        const taskConfig = sinon.createStubInstance(TaskConfig);

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
    const defaults = {
        taskName: 'default_task',
        task: sinon.createStubInstance(TaskConfig)
    };

    settings = Object.assign({}, defaults, settings);

    ProjectConfig.prototype.getTaskConfig
        .withArgs(settings.taskName).returns(settings.task);
}
