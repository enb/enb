'use strict'

const ModeConfig = require('../../../lib/config/mode-config');

describe('config/mode-config', function () {
    describe('constructor', function () {
        it('should call parent constructor', function () {
            const modeConfig = new ModeConfig();

            expect(modeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set mode name passed it params', function () {
            const mode = 'test_mode';
            const modeConfig = new ModeConfig(mode);

            expect(modeConfig._name).to.be.equal(mode);
        });
    });
});
