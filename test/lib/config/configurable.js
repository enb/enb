'use strict'

const vow = require('vow');
const Configurable = require('../../../lib/config/configurable');

describe('config/configurable', () => {
    let configurable;

    beforeEach(() => {
        configurable = new Configurable();
    });

    describe('addChain', () => {
        it('should add calback to call chain', () => {
            const testFunc = sinon.stub();

            configurable.addChain(testFunc);

            return configurable.exec().then(() => {
                expect(testFunc).to.be.called;
            });
        });

        it('should support method chaining pattern', () => {
            const result = configurable.addChain();

            expect(result).to.be.equal(configurable);
        });
    });

    describe('configure', () => {
        it('should add callback to call chain', () => {
            const testFunc = sinon.stub();

            configurable.configure(testFunc);

            return configurable.exec().then(() => {
                expect(testFunc).to.be.called;
            });
        });

        it('should support method chaining pattern', () => {
            const result = configurable.configure();

            expect(result).to.be.equal(configurable);
        });
    });

    describe('exec', () => {
        let spy;

        beforeEach(() => {
            spy = new sinon.spy();
        });

        it('should exec callback added to chain', () => {
            configurable.addChain(spy);
            configurable.exec();

            expect(spy).to.be.called;
        });

        it('should execute callbacks in order they were submitted', () => {
            const secondSpy = new sinon.spy();

            configurable.addChain(spy);
            configurable.addChain(secondSpy);

            return configurable.exec().then(() => {
                expect(secondSpy).to.be.calledAfter(spy);
            });
        });

        it('should pass self as first param to callbacks in chain if no context was passed', () => {
            configurable.addChain(spy);
            configurable.exec();

            expect(spy).to.be.calledWith(configurable);
        });

        it('should pass context to callback as first param', () => {
            const context = {};

            configurable.addChain(spy);
            configurable.exec(null, context);

            expect(spy.lastCall.args[0]).to.be.equal(context);
        });

        it('should pass exec args to callback', () => {
            const firstArg = 'foo';
            const secondArg = 'bar';
            const args = [firstArg, secondArg];

            configurable.addChain(spy);
            configurable.exec(args);

            expect(spy).to.be.calledWith(sinon.match.any, firstArg, secondArg);
        });

        it('should return promise which will be fulfilled when all tasks in chain will be complete', () => {
            const task = () => vow.resolve();

            configurable.addChain(task);

            return expect(configurable.exec())
                .to.be.fulfilled;
        });

        it('should return rejected promise if one of tasks in chain was rejected', () => {
            const task = () => vow.reject();

            configurable.addChain(task);

            return expect(configurable.exec())
                .to.be.rejected;
        });
    });
});
