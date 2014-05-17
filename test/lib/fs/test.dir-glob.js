var dirGlob = require('../../../lib/fs/dir-glob');
require('chai').should();

describe('lib', function () {
    describe('fs', function () {
        describe('dir-glob', function () {
            var globSync;
            beforeEach(function () {
                globSync = dirGlob.globSync;
            });
            it('should find directories', function (next) {
                var rootPath = __dirname;
                var nodes = 'test-bundles/*';
                var mask = rootPath + '/' + nodes;

                globSync(mask).should.deep.equal([
                    rootPath + '/test-bundles/bundle1',
                    rootPath + '/test-bundles/bundle2'
                ]);

                next();
            });
        });
    });
});
