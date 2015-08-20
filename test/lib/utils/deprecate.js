var path = require('path');
var util = require('util');
var stackTrace = require('stack-trace');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var expect = chai.expect;
var colorize = require('../../../lib/ui/colorize');
var Logger = require('../../../lib/logger');
var dropRequireCache = require('../../../lib/fs/drop-require-cache');

chai.use(sinonChai);

describe('deprecate', function () {
    var logStub;
    var deprecate;
    var deprecatePath = path.normalize(path.join(__dirname, '../../../lib/utils/deprecate.js'));

    before(function () {
        logStub = new sinon.stub(Logger.prototype, 'logWarningAction');
    });

    beforeEach (function () {
        dropRequireCache(require, deprecatePath);
        deprecate = require(deprecatePath);
        logStub.reset();
    });

    after(function () {
        logStub.restore();
    });

    describe('initialize', function () {
        var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };
        var hideWarningsStub;

        before(function () {
            hideWarningsStub = new sinon.stub(Logger.prototype, 'hideWarnings');
        });

        beforeEach(function () {
            hideWarningsStub.reset();
        });

        after(function () {
            hideWarningsStub.restore();
        });

        it('should put deprecate to initialized state if opts are not passed', function () {
            deprecate.initialize();
            deprecate.deprecate(messageInfo);

            expect(logStub).to.be.called;
        });

        it('should put deprecate to initialized state if opts are passed', function () {
            var opts = { hideWarnings: true };

            deprecate.initialize(opts);
            deprecate.deprecate(messageInfo);

            expect(logStub).to.be.called;
        });

        it('should disable warnings displaying if opts.showWarnings passed as false', function () {
            var opts = { hideWarnings: true };

            deprecate.initialize(opts);

            expect(hideWarningsStub).to.be.called;
        });

        it('should print delayed messages after initialization', function () {
            deprecate.deprecate(messageInfo);
            expect(logStub).to.be.not.called;

            deprecate.initialize();
            expect(logStub).to.be.calledOnce;
        });
    });

    describe('deprecate', function () {
        it('should throw error if no deprecated module provided', function () {
            var brokenMessageInfo = {
                method: 'testMethod',
                since: 'v1.0.0'
            };
            var func = function () {
                deprecate.deprecate(brokenMessageInfo);
            };

            expect(func).to.throw('Missing required field: module');
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
                var messageInfo = { module: 'deprecated_module', since: 'v1.0.0' };
                var expectedAction = 'deprecate';

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
