'use strict'

const NodeMaskConfig = require('../../../lib/config/node-mask-config');

describe('config/node-mask-config', () => {
    let nodeMaskConfig;
    const mask = /\w*bundles/g;

    beforeEach(() => {
        nodeMaskConfig = new NodeMaskConfig(mask);
    });

    describe('constructor', () => {
        it('should call parent constructor', () => {
            expect(nodeMaskConfig._chains).to.be.instanceOf(Array)
                .and.to.be.empty;
        });

        it('should set mask', () => {
            expect(nodeMaskConfig.getMask()).to.be.equal(mask);
        });
    });
});
