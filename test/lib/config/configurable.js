var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
var vow = require('vow');
var Configurable = require('../../../lib/config/configurable');

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('config/configurable', function () {
    var configurable;

    beforeEach(function () {
        configurable = new Configurable();
    });

    describe('constructor', function () {
        it('should create empty container for chains', function () {
            expect(configurable._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });
    });

    describe('addChain', function () {
        it('should add calback to call chain', function () {
            var testFunc = function () {};

            configurable.addChain(testFunc);

            expect(configurable._chains).to.contain(testFunc);
        });

        it('should support method chaining pattern', function () {
            var result = configurable.addChain();

            expect(result).to.be.equal(configurable);
        });
    });

    describe('configure', function () {
        it('should add calback to call chain', function () {
            var testFunc = function () {};

            configurable.configure(testFunc);

            expect(configurable._chains).to.contain(testFunc);
        });

        it('should support method chaining pattern', function () {
            var result = configurable.configure();

            expect(result).to.be.equal(configurable);
        });
    });

    describe('exec', function () {
        var spy;

        beforeEach(function () {
            spy = new sinon.spy();
        });

        it('should exec callback added to chain', function () {
            configurable.addChain(spy);
            configurable.exec();

            expect(spy).to.be.called;
        });

        it('should execute callbacks in order they were submitted', function () {
            var secondSpy = new sinon.spy();

            configurable.addChain(spy);
            configurable.addChain(secondSpy);

            return configurable.exec().then(function () {
                expect(secondSpy).to.be.calledAfter(spy);
            });
        });

        it('should pass self as first param to callbacks in chain if no context was passed', function () {
            configurable.addChain(spy);
            configurable.exec();

            expect(spy).to.be.calledWith(configurable);
        });

        it('should pass context to callback as first param', function () {
            var context = {};

            configurable.addChain(spy);
            configurable.exec(null, context);

            expect(spy.lastCall.args[0]).to.be.equal(context);
        });

        it('should pass exec args to callback', function () {
            var firstArg = 'foo';
            var secondArg = 'bar';
            var args = [firstArg, secondArg];

            configurable.addChain(spy);
            configurable.exec(args);

            expect(spy).to.be.calledWith(sinon.match.any, firstArg, secondArg);
        });

        it('should return promise which will be fulfilled when all tasks in chain will be complete', function () {
            var promise = vow.promise();
            var task = function () {
                return promise;
            };

            promise.fulfill();
            configurable.addChain(task);

            return configurable.exec().then(function () {
                expect(promise).to.be.fulfilled;
            });
        });

        it('should return rejected promise if one of tasks in chain was rejected', function () {
            var promise = vow.promise();
            var task = function () {
                return promise;
            };

            promise.reject();
            configurable.addChain(task);

            return configurable.exec().fail(function () {
                expect(promise).to.be.rejected;
            });
        });
    });
});
