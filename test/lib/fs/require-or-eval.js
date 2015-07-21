var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
var path = require('path');
var vow = require('vow');
var requireOrEval = require('../../../lib/fs/require-or-eval');

chai.use(chaiAsPromised);

describe('lib', function () {
    describe('fs', function () {
        describe('require-or-eval', function () {
            var oldPath;
            var modernPath;

            before(function () {
                oldPath = path.join(__dirname, '../../fixtures/bemjson/old.bemjson.js');
                modernPath = path.join(__dirname, '../../fixtures/bemjson/modern.bemjson.js');
            });

            it('should return promise as result', function () {
                var result = requireOrEval(oldPath);

                expect(result).to.be.instanceOf(vow.Promise);
            });

            it('should eval old json format', function () {
                return expect(requireOrEval(oldPath)).to.be.eventually.deep.equal({ block: 'button' });
            });

            it('should require modern bemjson format', function () {
                return expect(requireOrEval(modernPath)).to.be.eventually.deep.equal({ block: 'button' });
            });
        });
    });
});
