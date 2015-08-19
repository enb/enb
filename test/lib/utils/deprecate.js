var util = require('util');
var stackTrace = require('stack-trace');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var deprecate = require('../../../lib/utils/deprecate');
var colorize = require('../../../lib/ui/colorize');
var Logger = require('../../../lib/logger');

chai.use(sinonChai);

describe('deprecate', function () {
    var logStub;

    before(function () {
        logStub = new sinon.stub(Logger.prototype, 'logWarningAction');
    });

    beforeEach (function () {
        deprecate.reset();
        logStub.reset();
    });

    after(function () {
        logStub.restore();
    });

    describe('initialize', function () {
        var showWarningsStub;
        var hideWarningsStub;

        before(function () {
            showWarningsStub = new sinon.stub(Logger.prototype, 'showWarnings');
            hideWarningsStub = new sinon.stub(Logger.prototype, 'hideWarnings');
        });

        beforeEach(function () {
            showWarningsStub.reset();
            hideWarningsStub.reset();
        });

        after(function () {
            showWarningsStub.restore();
            hideWarningsStub.restore();
        });

        it('should put deprecate to initialized state if opts are not passed', function () {
            deprecate.initialize();

            expect(deprecate.isInitialized()).to.be.true;
        });

        it('should put deprecate to initialized state if opts are passed', function () {
            var opts = { showWarnings: true };

            deprecate.initialize(opts);

            expect(deprecate.isInitialized()).to.be.true;
        });

        it('should enable warnings displaying if opts.showWarnings passed as true', function () {
            var opts = { showWarnings: true };

            deprecate.initialize(opts);

            expect(showWarningsStub).to.be.called;
        });

        it('should disable warnings displaying if opts.showWarnings passed as false', function () {
            var opts = { showWarnings: false };

            deprecate.initialize(opts);

            expect(hideWarningsStub).to.be.called;
        });

        it('should disable warnings displaying if no opts passed', function () {
            var opts = { showWarnings: false };

            deprecate.initialize(opts);

            expect(hideWarningsStub).to.be.called;
        });

        it('should print delayed messages after initialization', function () {
            var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };

            deprecate.deprecate(messageInfo);
            expect(logStub).to.be.not.called;

            deprecate.initialize();
            expect(logStub).to.be.calledOnce;
        });
    });

    describe('reset', function () {
        it('should reset deprecate to uninitialized state', function () {
            deprecate.initialize();
            deprecate.reset();

            expect(deprecate.isInitialized()).to.be.false;
        });

        it('should remove delayed messages from queue', function () {
            var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };

            deprecate.deprecate(messageInfo);
            deprecate.reset();
            deprecate.initialize();

            expect(logStub).to.be.not.called;
        });
    });

    describe('deprecate', function () {
        it('should throw error if no deprecated module provided', function () {
            var messageInfo = {
                method: 'testMethod',
                since: 'v1.0.0'
            };
            var func = function () {
                deprecate.deprecate(messageInfo);
            };

            expect(func).to.throw('Missing required field "module"');
        });

        it('should throw error if version since deprecated entry will be removed provided', function () {
            var messageInfo = { module: 'deprecated_module' };
            var func = function () { deprecate.deprecate(messageInfo); };

            expect(func).to.throw('Missing required field "since"');
        });

        it('should delay message until initialization if deprecate is not initialized', function () {
            var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };

            deprecate.deprecate(messageInfo);
            expect(logStub).to.be.not.called;

            deprecate.initialize();
            expect(logStub).to.be.calledOnce;
        });

        describe('initialized deprecate', function () {
            beforeEach(function () {
                deprecate.initialize();
            });

            it('should print message if deprecate was already initialized', function () {
                var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.called;
            });

            it('should print log action as deprecate', function () {
                var expectedAction = 'deprecate';
                var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWith(expectedAction, sinon.match.any, sinon.match.any);
            });

            it('should print filename and code line which executed deprecate', function () {
                var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };
                var trace = stackTrace.get();
                var frame = trace[1];
                var expectedExecInfo = frame.getFileName() +
                    util.format(colorize.magenta('(%d.%d)'), frame.getLineNumber(), frame.getColumnNumber());

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWith(sinon.match.any, expectedExecInfo, sinon.match.any);
            });

            it('should print deprecated module name', function () {
                var deprecatedModule = 'deprecated_module';
                var messageInfo = { module: deprecatedModule, since: 'v1.0.0' };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWithMatch(sinon.match.any, sinon.match.any, deprecatedModule);
            });

            it('should print deprecated method name', function () {
                var deprecatedMethod = 'deprecated_method';
                var messageInfo = { module: 'deprecated_module', method: deprecatedMethod, since: 'v1.0.0' };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWithMatch(sinon.match.any, sinon.match.any, deprecatedMethod);
            });

            it('should print since version', function () {
                var sinceVersion = 'v1.0.0';
                var messageInfo = { module: 'deprecated_module', since: sinceVersion };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWithMatch(sinon.match.any, sinon.match.any, sinceVersion);
            });

            it('should print replacement module name', function () {
                var replaceModule = 'replacement_module';
                var messageInfo = { module: 'deprecated_module', since: 'v1.0.0', replaceModule: replaceModule };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWithMatch(sinon.match.any, sinon.match.any, replaceModule);
            });

            it('should print replacement method name', function () {
                var replaceMethod = 'replacement_method';
                var messageInfo = { module: 'deprecated_module', since: 'v1.0.0', replaceMethod: replaceMethod };

                deprecate.deprecate(messageInfo);

                expect(logStub).to.be.calledWithMatch(sinon.match.any, sinon.match.any, replaceMethod);
            });
        });

    });
});
