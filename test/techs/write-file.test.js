var proxyquire = require('proxyquire').noCallThru();
var fs = require('fs');
var mockFs = require('mock-fs');
var MockNode = proxyquire('mock-enb/lib/mock-node', {
    enb: require('../../lib/api'),
    'enb/lib/cache/cache-storage': require('../../lib/cache/cache-storage'),
    'enb/lib/cache/cache': require('../../lib/cache/cache')
});
var WriteFileTech = require('../../techs/write-file');

describe('techs/write-file', function () {
    var bundle;

    beforeEach(function () {
        mockFs({
            bundle: mockFs.directory({
                mode: 0755
            })
        });

        bundle = new MockNode('bundle');
    });

    afterEach(function () {
        mockFs.restore();
    });

    it('should write target file to file system', function () {
        return bundle.runTech(WriteFileTech, {
                target: '?.txt',
                content: 'I\'m here'
            })
            .should.be.fulfilled
            .then(function () {
                fs.readFileSync('bundle/bundle.txt').toString().should.be.eql('I\'m here');
            });
    });
});
