var FS = require('fs'),
    mockFS = require('mock-fs'),
    MockNode = require('mock-enb/lib/mock-node'),
    WriteFileTech = require('../../techs/write-file');

describe('techs/write-file', function () {
    var bundle;

    beforeEach(function () {
        mockFS({
            bundle: mockFS.directory({
                mode: 0755
            })
        });

        bundle = new MockNode('bundle');
    });

    afterEach(function () {
        mockFS.restore();
    });

    it('should write target file to file system', function () {
        return bundle.runTech(WriteFileTech, {
                target: '?.txt',
                content: 'I\'m here'
            })
            .should.be.fulfilled
            .then(function () {
                FS.readFileSync('bundle/bundle.txt').toString().should.be.eql('I\'m here');
            });
    });
});
