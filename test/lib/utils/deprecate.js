'use strict'

const path = require('path');
const vm = require('vm');
const Logger = require('../../../lib/logger');

describe('deprecate', () => {
    let deprecate;
    const deprecatePath = require.resolve('../../../lib/utils/deprecate.js');

    beforeEach (() => {
        deprecate = require(deprecatePath);
        sinon.sandbox.stub(Logger.prototype);
    });

    afterEach(() => {
        sinon.sandbox.restore();
    });

    describe('deprecate', () => {
        it('should throw error if no deprecated module provided', () => {
            ((() => { deprecate({ method: 'deprecated_method', since: 'v.1.0.0' }); }))
                .should.throw('Missing required field: module');
        });

        it('should delay message until initialization if deprecate is not initialized', () => {
            deprecate({ module: 'deprecated_module' });
            Logger.prototype.logWarningAction.should.not.be.called;

            deprecate.initialize();
            Logger.prototype.logWarningAction.should.be.calledOnce;
        });

        it('should print correct filename for delayed messages', () => {
            const contents = 'var deprecate = require(deprecatePath); deprecate({ module: "test_module" });';
            const context = vm.createContext({ require, deprecatePath });

            vm.runInContext(contents, context, '/test_module.js');
            deprecate.initialize();

            const expected = path.normalize('test/lib/utils/deprecate.js');

            Logger.prototype.logWarningAction
                .should.be.calledWithMatch(sinon.match.any, expected); // locates test file as smth called deprecate
        });

        describe('initialized deprecate', () => {
            beforeEach(() => {
                deprecate.initialize();
            });

            it('should print message if deprecate was already initialized', () => {
                deprecate({ module: 'deprecated_module' });

                Logger.prototype.logWarningAction.should.be.calledOnce;
            });

            it('should print log action as deprecate', () => {
                deprecate({ module: 'deprecated_module', since: 'v1.0.0' });

                Logger.prototype.logWarningAction.should.be.calledWith('deprecate');
            });

            it('should print filename and code line which executed deprecate', () => {
                deprecate({ module: 'deprecated_module' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, /([/.]|([A-Z]:))\S+:\d+.:\d+/, sinon.match.any);
            });

            it('should print deprecated module name', () => {
                deprecate({ module: 'deprecated_module' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'deprecated_module');
            });

            it('should print deprecated method name', () => {
                deprecate({ module: 'deprecated_module', method: 'deprecated_method' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'deprecated_method');
            });

            it('should print since version', () => {
                deprecate({ module: 'deprecated_module', rmSince: 'v1.0.0' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'v1.0.0');
            });

            it('should print replacement module name', () => {
                deprecate({ module: 'deprecated_module', replaceModule: 'replacement_module' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'replacement_module');
            });

            it('should print replacement method name', () => {
                deprecate({ module: 'deprecated_module', replaceMethod: 'replacement_method' });

                Logger.prototype.logWarningAction
                    .should.be.calledWithMatch(sinon.match.any, sinon.match.any, 'replacement_method');
            });
        });
    });
});
