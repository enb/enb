'use strict';

const proxyquire = require('proxyquire').noCallThru();
const fs = require('fs');
const mockFs = require('mock-fs');
const MockNode = proxyquire('mock-enb/lib/mock-node', {
    enb: require('../../lib/api'),
    'enb/lib/cache/cache-storage': require('../../lib/cache/cache-storage'),
    'enb/lib/cache/cache': require('../../lib/cache/cache')
});
const WriteFileTech = require('../../techs/write-file');

describe('techs/write-file', function () {
    let bundle;

    beforeEach(function () {
        mockFs({
            bundle: mockFs.directory({
                mode: 0o755
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
