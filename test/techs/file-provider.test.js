var proxyquire = require('proxyquire').noCallThru();
var mockFs = require('mock-fs');
var MockNode = proxyquire('mock-enb/lib/mock-node', {
    enb: require('../../lib/api'),
    'enb/lib/cache/cache-storage': require('../../lib/cache/cache-storage'),
    'enb/lib/cache/cache': require('../../lib/cache/cache')
});
var FileProviderTech = require('../../techs/file-provider');

describe('techs/file-provider', function () {
    var bundle,
        resolveSpy,
        rejectSpy;

    beforeEach(function () {
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

    afterEach(function () {
        mockFs.restore();
    });

    it('should prodive file to target', function () {
        return bundle.runTech(FileProviderTech, { target: 'file.txt' })
            .should.be.fulfilled
            .then(function () {
                resolveSpy.should.calledWith('file.txt');
            });
    });

    it('should provide file to target with absolute path', function () {
        return bundle.runTech(FileProviderTech, { target: '/absolute.txt' })
            .should.be.fulfilled
            .then(function () {
                resolveSpy.should.calledWith('/absolute.txt');
            });
    });

    it('should reject target if file is not found', function () {
        return bundle.runTech(FileProviderTech, { target: 'non-existent.txt' })
            .should.be.rejectedWith('file not found')
            .then(function () {
                rejectSpy.should.calledWith('non-existent.txt');
            });
    });
});
