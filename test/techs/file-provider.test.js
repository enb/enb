'use strict'

const proxyquire = require('proxyquire').noCallThru();
const mockFs = require('mock-fs');
const MockNode = proxyquire('mock-enb/lib/mock-node', {
    enb: require('../../lib/api'),
    'enb/lib/cache/cache-storage': require('../../lib/cache/cache-storage'),
    'enb/lib/cache/cache': require('../../lib/cache/cache')
});
const FileProviderTech = require('../../techs/file-provider');

describe('techs/file-provider', () => {
    let bundle;
    let resolveSpy;
    let rejectSpy;

    beforeEach(() => {
        mockFs({
            bundle: {
                'file.txt': 'I\'m here'
            },
            '/absolute.txt': 'You\'re here'
        });

        bundle = new MockNode('bundle');
        resolveSpy = sinon.spy(bundle, 'resolveTarget');
        rejectSpy = sinon.spy(bundle, 'rejectTarget');
    });

    afterEach(() => {
        mockFs.restore();
    });

    it('should prodive file to target', () => {
        return bundle.runTech(FileProviderTech, { target: 'file.txt' })
            .should.be.fulfilled
            .then(() => {
                resolveSpy.should.calledWith('file.txt');
            });
    });

    it('should provide file to target with absolute path', () => {
        return bundle.runTech(FileProviderTech, { target: '/absolute.txt' })
            .should.be.fulfilled
            .then(() => {
                resolveSpy.should.calledWith('/absolute.txt');
            });
    });

    it('should reject target if file is not found', () => {
        return bundle.runTech(FileProviderTech, { target: 'non-existent.txt' })
            .should.be.rejectedWith('file not found')
            .then(() => {
                rejectSpy.should.calledWith('non-existent.txt');
            });
    });
});
