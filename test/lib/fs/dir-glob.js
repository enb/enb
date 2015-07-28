var path = require('path');
var dirGlob = require('../../../lib/fs/dir-glob');
require('chai').should();

describe('fs/dir-glob', function () {
    var globSync;
    beforeEach(function () {
        globSync = dirGlob.globSync;
    });
    it('should find directories', function (next) {
        var rootPath = __dirname;
        var nodes = path.join('test-bundles', '*');
        var mask = path.join(rootPath, nodes);

        globSync(mask).sort().should.deep.equal([
            path.join(rootPath,'test-bundles', 'bundle1'),
            path.join(rootPath,'test-bundles', 'bundle2'),
        ]);

        next();
    });
});
