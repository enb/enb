var ModeConfig = require('../../../lib/config/mode-config');

describe('config/mode-config', function () {
    describe('constructor', function () {
        it('should call parent constructor', function () {
            var modeConfig = new ModeConfig();

            expect(modeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set mode name passed it params', function () {
            var mode = 'test_mode';
            var modeConfig = new ModeConfig(mode);

            expect(modeConfig._name).to.be.equal(mode);
        });
    });
});
