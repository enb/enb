'use strict'

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const vow = require('vow');
const TaskConfig = require('../../../lib/config/task-config');
const MakePlatform = require('../../../lib/make');
const EOL = require('os').EOL;

describe('config/task-config', () => {
    const sandbox = sinon.sandbox.create();
    let taskConfig;
    const taskName = 'test_task';
    let makePlatform;
    const projectPath = path.join(__dirname, '../../fixtures/sample-project');
    const makePlatformMode = 'test';

    beforeEach(() => {
        sandbox.stub(fs, 'existsSync');
        fs.existsSync.returns(true);

        taskConfig = new TaskConfig(taskName);
        makePlatform = new MakePlatform();
        makePlatform.init(projectPath, makePlatformMode, () => {});
        taskConfig.setMakePlatform(makePlatform);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should call parent constructor', () => {
            expect(taskConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set task name', () => {
            expect(taskConfig._name).to.be.equal(taskName);
        });
    });

    describe('setMakePlatform', () => { // setMakePlatform is being called implicitly in beforeEach
        it('should set make platform', () => {
            expect(taskConfig._makePlatform).to.be.equal(makePlatform);
        });

        it('should set logger as sublogger from make platform', () => {
            const expectedSubloggerScope = `:${taskName}`;

            expect(taskConfig._logger._scope).to.be.equal(expectedSubloggerScope);
        });
    });

    describe('log', () => {
        it('should log message', () => {
            const testMessage = 'test_message';
            const loggerSpy = new sinon.spy(taskConfig._logger, 'log');

            taskConfig.log(testMessage);

            expect(loggerSpy).to.be.calledWith(testMessage);
        });
    });

    describe('buildTarget', () => {
        const target = 'test_target';

        it('should initiate target build', () => {
            const spy = new sinon.spy(taskConfig, 'buildTargets');
            const expectedTargets = [target];

            taskConfig.buildTarget(target);

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should initiate target build for undefined target', () => {
            const spy = new sinon.spy(taskConfig, 'buildTargets');
            const expectedTargets = [undefined];

            taskConfig.buildTarget();

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should return promise', () => {
            const result = taskConfig.buildTargets(target);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('buildTargets', () => {
        const targets = ['test_target'];

        it('should initiate targets build', () => {
            const spy = new sinon.spy(makePlatform, 'buildTargets');

            taskConfig.buildTargets(targets);

            expect(spy).to.be.calledWith(targets);
        });

        it('should initiate targets build for empty targets', () => {
            const spy = new sinon.spy(makePlatform, 'buildTargets');

            taskConfig.buildTargets([]);

            expect(spy).to.be.calledWith([]);
        });

        it('should initiate targets build for undefined targets', () => {
            const spy = new sinon.spy(makePlatform, 'buildTargets');

            taskConfig.buildTargets();

            expect(spy).to.be.calledWith(undefined);
        });

        it('should return promise', () => {
            const result = taskConfig.buildTargets(targets);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('cleanTarget', () => {
        const target = 'test_target';

        it('should initiate target clean', () => {
            const spy = new sinon.spy(taskConfig, 'cleanTargets');
            const expectedTargets = [target];

            taskConfig.cleanTarget(target);

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should initiate target clean for undefined target', () => {
            const spy = new sinon.spy(taskConfig, 'cleanTargets');
            const expectedTargets = [undefined];

            taskConfig.cleanTarget();

            expect(spy).to.be.calledWith(expectedTargets);
        });

        it('should return promise', () => {
            const result = taskConfig.cleanTarget(target);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('cleanTargets', () => {
        const targets = ['test_target'];

        it('should initiate targets clean', () => {
            const spy = new sinon.spy(makePlatform, 'cleanTargets');

            taskConfig.cleanTargets(targets);

            expect(spy).to.be.calledWith(targets);
        });

        it('should initiate targets clean for empty targets', () => {
            const spy = new sinon.spy(makePlatform, 'cleanTargets');

            taskConfig.cleanTargets([]);

            expect(spy).to.be.calledWith([]);
        });

        it('should initiate targets clean for undefined targets', () => {
            const spy = new sinon.spy(makePlatform, 'cleanTargets');

            taskConfig.cleanTargets();

            expect(spy).to.be.calledWith(undefined);
        });

        it('should return promise', () => {
            const result = taskConfig.cleanTargets(targets);

            expect(result).to.be.instanceOf(vow.Promise);
        });
    });

    describe('shell', () => {
        const command = 'echo test';
        let execSpy;

        before(() => {
            execSpy = new sinon.spy(childProcess, 'exec');
        });

        beforeEach(() => {
            execSpy.reset();
        });

        after(() => {
            execSpy.restore();
        });

        it('should execute shell command', () => {
            taskConfig.shell(command);

            expect(execSpy).to.be.calledWith(command);
        });

        it('should pass opts for shell command', () => {
            const opts = { foo: 'bar' };

            taskConfig.shell(command, opts);

            const optsArg = execSpy.lastCall.args[1];

            expect(optsArg).to.have.property('foo', 'bar');
        });

        it('should add env variables from make platform', () => {
            const opts = { foo: 'bar' };
            const expectedOpts = {
                foo: 'bar',
                env: makePlatform.getEnv()
            };

            taskConfig.shell(command, opts);

            expect(execSpy).to.be.calledWith(sinon.match.any, expectedOpts);
        });

        it('should concat user provided env variables with env variables from make platform', () => {
            const opts = { env: { foo: 'bar' } };
            const expectedOpts = { env: makePlatform.getEnv() };
            expectedOpts.env.foo = 'bar';

            taskConfig.shell(command, opts);

            expect(execSpy).to.be.calledWith(sinon.match.any, expectedOpts);
        });

        it('should prioritise user defined env variables over env variables provided by make platform', () => {
            const makePlatformEnv = { foo: 'bar' };
            const optsEnv = { foo: 'baz' };
            const expectedOpts = { env: optsEnv };

            makePlatform.setEnv(makePlatformEnv);
            taskConfig.shell(command, { env: optsEnv });

            expect(execSpy).to.be.calledWith(sinon.match.any, expectedOpts);
        });

        it('should log command which will be executed', () => {
            const logSpy = new sinon.spy(taskConfig, 'log');
            const expectedOutput = `$ ${command}`;

            taskConfig.shell(command);

            expect(logSpy).to.be.calledWith(expectedOutput);
        });

        it('should return promise', () => {
            const result = taskConfig.shell(command);

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should fulfill promise if command executed successfully', () => expect(taskConfig.shell(command)).to.be.fulfilled);

        it('should pass command output to promise', () => {
            const expectedOutput = `test${EOL}`;

            return taskConfig.shell(command).then(results => {
                const output = results[0];
                expect(output).to.be.equal(expectedOutput);
            });
        });

        it('should reject promise of command execution was not successful', () => {
            const brokenCommand = 'cal -a';

            return expect(taskConfig.shell(brokenCommand)).to.be.rejected;
        });

        it('should pass error with command failure reason to rejected promise', () => {
            const brokenCommand = 'cal -a';

            return taskConfig.shell(brokenCommand).fail(error => {
                expect(error).to.be.instanceOf(Error);
            });
        });
    });
});
