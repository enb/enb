var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var MakePlatform = require('../../../lib/make');
var Node = require('../../../lib/node');
var NodeConfig = require('../../../lib/config/node-config');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var TaskConfig = require('../../../lib/config/task-config');
var Logger = require('../../../lib/logger');

describe('make/misc', function () {
    var makePlatform;
    var sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function (done) {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill()); //prevent temp dir creation on MakePlatform.init()

        ProjectConfig.prototype.getNodeConfig.returns(sinon.createStubInstance(NodeConfig));
        ProjectConfig.prototype.getNodeMaskConfigs.returns([sinon.createStubInstance(NodeMaskConfig)]);

        makePlatform = new MakePlatform();
        makePlatform.init(path.normalize('/path/to/project'), 'mode', function () {}).then(done);
        makePlatform.setLogger(sinon.createStubInstance(Logger));
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('requireNodeSources', function () {
        it('should return promise', function () {
            var result = makePlatform.requireNodeSources(path.normalize('path/to/node'));

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should init required node', function () {
            var initNode = sinon.spy(makePlatform, 'initNode');

            makePlatform.requireNodeSources(path.normalize('path/to/node'));

            expect(initNode).to.be.calledWith(path.normalize('path/to/node'));
        });

        it('should require sources from initialized node', function () {
            return makePlatform.requireNodeSources(path.normalize('path/to/node')).then(function () {
                expect(Node.prototype.requireSources).to.be.called;
            });
        });

        it('should pass required targets to node when require sources from it', function () {
            return makePlatform.requireNodeSources(path.normalize('path/to/node'), ['?.js']).then(function () {
                expect(Node.prototype.requireSources).to.be.calledWith(['?.js']);
            });
        });
    });

    describe('buildTask', function () {
        var taskConfig;

        beforeEach(function () {
            taskConfig = sinon.createStubInstance(TaskConfig);

            ProjectConfig.prototype.getTaskConfig
                .withArgs('test_task').returns(taskConfig);
        });

        it('should return promise', function () {
            var result = makePlatform.buildTask('test_task');

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should throw if no task config available in project config for specified task', function () {
            expect(function () { makePlatform.buildTask('another_task'); }).to.throw;
        });

        it('should pass make platform to task config', function () {
            makePlatform.buildTask('test_task');

            expect(taskConfig.setMakePlatform).to.be.calledWith(makePlatform);
        });

        it('should execute task', function () {
            return makePlatform.buildTask('test_task').then(function () {
                expect(taskConfig.exec).to.be.called;
            });
        });

        it('should pass args to task config on exec', function () {
            return makePlatform.buildTask('test_task', ['foo', 'bar']).then(function () {
                expect(taskConfig.exec).to.be.calledWith(['foo', 'bar']);
            });
        });
    });
});
