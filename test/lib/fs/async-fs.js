var vowFs = require('vow-fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var path = require('path');
var dropRequireCache = require('../../../lib/fs/drop-require-cache');

describe('lib', function () {
    describe('fs', function () {
        describe('async-fs', function () {
            var previousLimit;
            var asyncFsPath;
            var optionsSpy;

            before(function () {
                previousLimit = process.env.ENB_FILE_LIMIT;
                asyncFsPath = path.join(__dirname, '../../../lib/fs/async-fs.js');
                optionsSpy = sinon.spy(vowFs, 'options');
            });

            beforeEach(function () {
                dropRequireCache(require, asyncFsPath);
                optionsSpy.reset();
            });

            it('should return vowFs as it\'s result', function () {
                var asyncFs = require(asyncFsPath);

                expect(asyncFs).to.be.equal(vowFs);
            });

            it('should not set file limit if it was not defined in process.env', function () {
                delete process.env.ENB_FILE_LIMIT; //remove process.env.ENB_FILE_LIMIT explicitly

                require(asyncFsPath);

                sinon.assert.notCalled(optionsSpy);
            });

            it('should set file limit to vow-fs if it was defined in process.env', function () {
                process.env.ENB_FILE_LIMIT = 1;

                require(asyncFsPath);
                sinon.assert.calledWith(optionsSpy, {
                    openFileLimit: parseInt(process.env.ENB_FILE_LIMIT, 10)
                });
            });

            after(function () {
                delete process.env.ENB_FILE_LIMIT;
                previousLimit && (process.env.ENB_FILE_LIMIT = previousLimit);
            });
        });
    });
});
