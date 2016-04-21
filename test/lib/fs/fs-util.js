'use strict';

var fsUtil = require('../../../lib/fs/fs-util');

describe('fs/fs-util', function () {
    describe('mkHash', function () {
        it('should return valid filename', function () {
            var result = fsUtil.mkHash('../../some/file.js');
            expect(result).to.be.equal('.._.._some_file.js');
        });

        it('should return valid win filename', function () {
            var result = fsUtil.mkHash('C:\\some dir\\file.js');
            expect(result).to.be.equal('C__some_dir_file.js');
        });
    });
});
