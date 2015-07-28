var dropRequireCache = require('../../../lib/fs/drop-require-cache');
var expect = require('chai').expect;
var path = require('path');

describe('fs/drop-require-cache', function () {
    var fixturePath = path.join(__dirname, '../../fixtures/modules/call-count.js');
    var module;

    beforeEach(function () {
        module = require(fixturePath);
    });

    it('should remove required module from cache', function () {
        module.callCounter();

        dropRequireCache(require, fixturePath);
        expect(require.cache[fixturePath]).to.be.undefined;
        expect(require(fixturePath).callCounter()).to.be.equal(1);
    });

    it('should remove parent reference for module removed from cache', function () {
        var cachedModule = require.cache[fixturePath];

        dropRequireCache(require, fixturePath);
        expect(cachedModule.parent).to.be.undefined;
    });

    it('should remove module reference from module parent\'s children', function () {
        var cachedModuleParent = require.cache[fixturePath].parent;

        dropRequireCache(require, fixturePath);
        expect(cachedModuleParent.children).to.not.contain(fixturePath);
    });
});
