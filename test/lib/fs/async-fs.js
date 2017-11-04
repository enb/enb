'use strict'

const path = require('path');

const vowFs = require('vow-fs');
const fileEval = require('file-eval');

describe('fs/async-fs', () => {
    let previousLimit;
    const asyncFsPath = path.join(__dirname, '../../../lib/fs/async-fs.js');
    const sandbox = sinon.sandbox.create();

    before(() => {
        previousLimit = process.env.ENB_FILE_LIMIT;
    });

    beforeEach(() => {
        sandbox.stub(vowFs);
    });

    afterEach(() => {
        delete process.env.ENB_FILE_LIMIT;
        sandbox.restore();
    });

    after(() => {
        previousLimit && (process.env.ENB_FILE_LIMIT = previousLimit);
    });

    it('should return vowFs as it\'s result', () => {
        const asyncFs = fileEval.sync(asyncFsPath);

        expect(asyncFs).to.be.equal(vowFs);
    });

    it('should not set file limit if it was not defined in process.env', () => {
        fileEval.sync(asyncFsPath);

        sinon.assert.notCalled(vowFs.options);
    });

    it('should set file limit to vow-fs if it was defined in process.env', () => {
        process.env.ENB_FILE_LIMIT = 1;

        fileEval.sync(asyncFsPath);
        sinon.assert.calledWith(vowFs.options, {
            openFileLimit: parseInt(process.env.ENB_FILE_LIMIT, 10)
        });
    });
});
