'use strict';

var fsUtil = require('../../../lib/fs/fs-util');
var crypto = require('crypto');

describe('fs/fs-util', function () {
    describe('mkHash', function () {
        it('should return md5 hash', function () {
            var path = '../../some/file.js';
            var hash = crypto.createHash('md5').update(path).digest('hex');

            var result = fsUtil.mkHash(path);

            expect(result).to.be.equal(hash);
        });
    });
});
