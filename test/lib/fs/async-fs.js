var vowFs = require('vow-fs');
var path = require('path');
var clearRequire = require('clear-require');

describe('fs/async-fs', function () {
    var previousLimit;
    var asyncFsPath = path.join(__dirname, '../../../lib/fs/async-fs.js');
    var sandbox = sinon.sandbox.create();

    before(function () {
        previousLimit = process.env.ENB_FILE_LIMIT;
    });

    beforeEach(function () {
        clearRequire(asyncFsPath);
        sandbox.stub(vowFs);
    });

    afterEach(function () {
        delete process.env.ENB_FILE_LIMIT;
        sandbox.restore();
    });

    after(function () {
        previousLimit && (process.env.ENB_FILE_LIMIT = previousLimit);
    });

    it('should return vowFs as it\'s result', function () {
        var asyncFs = require(asyncFsPath);

        expect(asyncFs).to.be.equal(vowFs);
    });

    it('should not set file limit if it was not defined in process.env', function () {
        require(asyncFsPath);

        sinon.assert.notCalled(vowFs.options);
    });

    it('should set file limit to vow-fs if it was defined in process.env', function () {
        process.env.ENB_FILE_LIMIT = 1;

        require(asyncFsPath);
        sinon.assert.calledWith(vowFs.options, {
            openFileLimit: parseInt(process.env.ENB_FILE_LIMIT, 10)
        });
    });
});
