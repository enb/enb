var vm = require('vm');
var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var Logger = require('../../../lib/logger');
var dropRequireCache = require('../../../lib/fs/drop-require-cache');

chai.should();
chai.use(sinonChai);

describe('deprecate', function () {
    var deprecate;
    var deprecatePath = require.resolve('../../../lib/utils/deprecate.js');

    beforeEach (function () {
        //dropping cache because need to have uninitialized deprecate before each test
        dropRequireCache(require, deprecatePath);
        deprecate = require(deprecatePath);
        sinon.sandbox.stub(Logger.prototype);
    });

    afterEach(function () {
        sinon.sandbox.restore();
    });

    describe('deprecate', function () {
        it('should throw error if no deprecated module provided', function () {
            (function () { deprecate({ method: 'deprecated_method', since: 'v.1.0.0' }); })
                .should.throw('Missing required field: module');
        });

        it('should delay message until initialization if deprecate is not initialized', function () {
            deprecate({ module: 'deprecated_module' });
            Logger.prototype.logWarningAction.should.not.be.called;

            deprecate.initialize();
            Logger.prototype.logWarningAction.should.be.calledOnce;
        });

        it('should print correct filename for delayed messages', function () {
            var contents = 'var deprecate = require("' + deprecatePath + '"); ' +
                'deprecate({ module: "test_module" });';
            var context = vm.createContext({ 'require': require });

            vm.runInContext(contents, context, { filename: '/test_module.js' });
            deprecate.initialize();

            Logger.prototype.logWarningAction
                .should.be.calledWithMatch(sinon.match.any, __filename); //locates test file as smth called deprecate
        });

        describe('initialized deprecate', function () {
            beforeEach(function () {
                deprecate.initialize();
            });

            it('should print message if deprecate was already initialized', function () {
                deprecate({ module: 'deprecated_module' });

                Logger.prototype.logWarningAction.should.be.calledOnce;
            });

            it('should print log action as deprecate', function () {
                deprecate({ module: 'deprecated_module', since: 'v1.0.0' });

                Logger.prototype.logWarningAction.should.be.calledWith('deprecate');
            });

            it('should print filename and code line which executed deprecate', function () {
                deprecate({ module: 'deprecated_module' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, /([\/.]|([A-Z]:))\S+\(\d+.\d+\)/, sinon.match.any);
            });

            it('should print deprecated module name', function () {
                deprecate({ module: 'deprecated_module' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'deprecated_module');
            });

            it('should print deprecated method name', function () {
                deprecate({ module: 'deprecated_module', method: 'deprecated_method' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'deprecated_method');
            });

            it('should print since version', function () {
                deprecate({ module: 'deprecated_module', rmSince: 'v1.0.0' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'v1.0.0');
            });

            it('should print replacement module name', function () {
                deprecate({ module: 'deprecated_module', replaceModule: 'replacement_module' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'replacement_module');
            });

            it('should print replacement method name', function () {
                deprecate({ module: 'deprecated_module', replaceMethod: 'replacement_method' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'replacement_method');
            });
        });

    });
});
