'use strict'

var ModuleConfig = require('../../../lib/config/module-config');

describe('config/module-config', function () {
    describe('constructor', function () {
        it('should call parent constructor', function () {
            var modeConfig = new ModuleConfig();

            expect(modeConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });
    });

    describe('getName', function () {
        it('should throw error about you need to override getName method', function () {
            var moduleConfig = new ModuleConfig();

            expect(function () { moduleConfig.getName(); }).to.throw('You should override "getName" method of module.');
        });
    });
});
