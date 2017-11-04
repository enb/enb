'use strict'

const ModeConfig = require('../../../lib/config/mode-config');

describe('config/mode-config', () => {
    describe('constructor', () => {
        it('should call parent constructor', () => {
            const modeConfig = new ModeConfig();

            expect(modeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set mode name passed it params', () => {
            const mode = 'test_mode';
            const modeConfig = new ModeConfig(mode);

            expect(modeConfig._name).to.be.equal(mode);
        });
    });
});
