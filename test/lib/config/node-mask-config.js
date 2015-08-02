var expect = require('chai').expect;
var NodeMaskConfig = require('../../../lib/config/node-mask-config');

describe('config/node-mask-config', function () {
    var nodeMaskConfig;
    var mask = /\w*bundles/g;

    beforeEach(function () {
        nodeMaskConfig = new NodeMaskConfig(mask);
    });

    describe('constructor', function () {
        it('should call parent constructor', function () {
            expect(nodeMaskConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set mask', function () {
            expect(nodeMaskConfig.getMask()).to.be.equal(mask);
        });
    });
});
