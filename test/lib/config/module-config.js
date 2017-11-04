'use strict'

const ModuleConfig = require('../../../lib/config/module-config');

describe('config/module-config', () => {
    describe('constructor', () => {
        it('should call parent constructor', () => {
            const modeConfig = new ModuleConfig();

            expect(modeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });
    });

    describe('getName', () => {
        it('should throw error about you need to override getName method', () => {
            const moduleConfig = new ModuleConfig();

            expect(() => { moduleConfig.getName(); }).to.throw('You should override "getName" method of module.');
        });
    });
});
