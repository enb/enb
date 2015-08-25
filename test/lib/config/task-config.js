var path = require('path');
var childProcess = require('child_process');
var vow = require('vow');
var TaskConfig = require('../../../lib/config/task-config');
var MakePlatform = require('../../../lib/make');
var EOL = require('os').EOL;

describe('config/task-config', function () {
    var taskConfig;
    var taskName = 'test_task';
    var makePlatform;
    var projectPath = path.join(__dirname, '../../fixtures/sample-project');
    var makePlatformMode = 'test';

    beforeEach(function () {
        taskConfig = new TaskConfig(taskName);
        makePlatform = new MakePlatform();
        makePlatform.init(projectPath, makePlatformMode);
        taskConfig.setMakePlatform(makePlatform);
    });

    describe('constructor', function () {
        it('should call parent constructor', function () {
            expect(taskConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set task name', function () {
            expect(taskConfig._name).to.be.equal(taskName);
        });
    });

    describe('setMakePlatform', function () { //setMakePlatform is being called implicitly in beforeEach
        it('should set make platform', function () {
            expect(taskConfig._makePlatform).to.be.equal(makePlatform);
        });

        it('should set logger as sublogger from make platform', function () {
            var expectedSubloggerScope = ':' + taskName;

            expect(taskConfig._logger._scope).to.be.equal(expectedSubloggerScope);
        });
    });

    describe('log', function () {
        it('should log message', function () {
            var testMessage = 'test_message';
            var loggerSpy = new sinon.spy(taskConfig._logger, 'log');

            taskConfig.log(testMessage);

            expect(loggerSpy).to.be.calledWith(testMessage);
        });
    });

    describe('buildTarget', function () {
        var target = 'test_target';

        it('should initiate target build', function () {
            var spy = new sinon.spy(taskConfig, 'buildTargets');
            var expectedTargets = [target];

            taskConfig.buildTarget(target);

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should initiate target build for undefined target', function () {
            var spy = new sinon.spy(taskConfig, 'buildTargets');
            var expectedTargets = [undefined];

            taskConfig.buildTarget();

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should return promise', function () {
            var result = taskConfig.buildTargets(target);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('buildTargets', function () {
        var targets = ['test_target'];

        it('should initiate targets build', function () {
            var spy = new sinon.spy(makePlatform, 'buildTargets');

            taskConfig.buildTargets(targets);

            expect(spy).to.be.calledWith(targets);
        });

        it('should initiate targets build for empty targets', function () {
            var spy = new sinon.spy(makePlatform, 'buildTargets');

            taskConfig.buildTargets([]);

            expect(spy).to.be.calledWith([]);
        });

        it('should initiate targets build for undefined targets', function () {
            var spy = new sinon.spy(makePlatform, 'buildTargets');

            taskConfig.buildTargets();

            expect(spy).to.be.calledWith(undefined);
        });

        it('should return promise', function () {
            var result = taskConfig.buildTargets(targets);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('cleanTarget', function () {
        var target = 'test_target';

        it('should initiate target clean', function () {
            var spy = new sinon.spy(taskConfig, 'cleanTargets');
            var expectedTargets = [target];

            taskConfig.cleanTarget(target);

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should initiate target clean for undefined target', function () {
            var spy = new sinon.spy(taskConfig, 'cleanTargets');
            var expectedTargets = [undefined];

            taskConfig.cleanTarget();

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should return promise', function () {
            var result = taskConfig.cleanTarget(target);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('cleanTargets', function () {
        var targets = ['test_target'];

        it('should initiate targets clean', function () {
            var spy = new sinon.spy(makePlatform, 'cleanTargets');

            taskConfig.cleanTargets(targets);

            expect(spy).to.be.calledWith(targets);
        });

        it('should initiate targets clean for empty targets', function () {
            var spy = new sinon.spy(makePlatform, 'cleanTargets');

            taskConfig.cleanTargets([]);

            expect(spy).to.be.calledWith([]);
        });

        it('should initiate targets clean for undefined targets', function () {
            var spy = new sinon.spy(makePlatform, 'cleanTargets');

            taskConfig.cleanTargets();

            expect(spy).to.be.calledWith(undefined);
        });

        it('should return promise', function () {
            var result = taskConfig.cleanTargets(targets);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('shell', function () {
        var command = 'echo test';
        var execSpy;

        before(function () {
            execSpy = new sinon.spy(childProcess, 'exec');
        });

        beforeEach(function () {
            execSpy.reset();
        });

        after(function () {
            execSpy.restore();
        });

        it('should execute shell command', function () {
            taskConfig.shell(command);

            expect(execSpy).to.be.calledWith(command);
        });

        it('should pass opts for shell command', function () {
            var opts = { foo: 'bar' };

            taskConfig.shell(command, opts);

            var optsArg = execSpy.lastCall.args[1];

            expect(optsArg).to.have.property('foo', 'bar');
        });

        it('should add env variables from make platform', function () {
            var opts = { foo: 'bar' };
            var expectedOpts = {
                foo: 'bar',
                env: makePlatform.getEnv()
            };

            taskConfig.shell(command, opts);

            expect(execSpy).to.be.calledWith(sinon.match.any, expectedOpts);
        });

        it('should concat user provided env variables with env variables from make platform', function () {
            var opts = { env: { foo: 'bar' } };
            var expectedOpts = { env: makePlatform.getEnv() };
            expectedOpts.env.foo = 'bar';

            taskConfig.shell(command, opts);

            expect(execSpy).to.be.calledWith(sinon.match.any, expectedOpts);
        });

        it('should prioritise user defined env variables over env variables provided by make platform', function () {
            var makePlatformEnv = { foo: 'bar' };
            var optsEnv = { foo: 'baz' };
            var expectedOpts = { env: optsEnv };

            makePlatform.setEnv(makePlatformEnv);
            taskConfig.shell(command, { env: optsEnv });

            expect(execSpy).to.be.calledWith(sinon.match.any, expectedOpts);
        });

        it('should log command which will be executed', function () {
            var logSpy = new sinon.spy(taskConfig, 'log');
            var expectedOutput = '$ ' + command;

            taskConfig.shell(command);

            expect(logSpy).to.be.calledWith(expectedOutput);
        });

        it('should return promise', function () {
            var result = taskConfig.shell(command);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should fulfill promise if command executed successfully', function () {
            return expect(taskConfig.shell(command)).to.be.fulfilled;
        });

        it('should pass command output to promise', function () {
            var expectedOutput = 'test' + EOL;

            return taskConfig.shell(command).then(function (results) {
                var output = results[0];
                expect(output).to.be.equal(expectedOutput);
            });
        });

        it('should reject promise of command execution was no successful', function () {
            var brokenCommand = 'cal -a';

            return expect(taskConfig.shell(brokenCommand)).to.be.rejected;
        });

        it('should pass error with command failure reason to rejected promise', function () {
            var brokenCommand = 'cal -a';

            return taskConfig.shell(brokenCommand).fail(function (error) {
                expect(error).to.be.instanceOf(Error);
            });
        });
    });
});
