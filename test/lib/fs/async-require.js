var vow = require('vow');
var path = require('path');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var expect = chai.expect;
var asyncRequire = require('../../../lib/fs/async-require');

chai.use(chaiAsPromised);

describe('lib', function () {
    describe('fs', function () {
        describe('async-require', function () {
            var fixturePath;

            before(function () {
                fixturePath = path.join(__dirname, '../../fixtures/modules/call-count.js');
            });

            it('should return promise as it\'s result', function () {
                var promise = asyncRequire(fixturePath);

                expect(promise).to.be.instanceOf(vow.Promise);
            });

            it('should provide required module as promise result', function () {
                var syncRequiredModule = require(fixturePath);

                return expect(asyncRequire(fixturePath)).to.eventually.be.equal(syncRequiredModule);
            });

            it('should pass error to rejected handler if failed to require file', function () {
                return expect(asyncRequire(null)).to.eventually.be.rejectedWith(Error);
            });

            it('should delay file opening if no free file descriptors available', function () {
                var emfileExcFixturePath = path.join(__dirname, '../../fixtures/modules/emfile-exc.js');
                global.__EMFILE_EXC_THROWN = false;

                return asyncRequire(emfileExcFixturePath).then(function (asyncRequiredModule) {
                    var syncRequiredModule = require(emfileExcFixturePath);
                    expect(asyncRequiredModule).to.be.equal(syncRequiredModule);
                });
            });

            after(function () {
                delete global.__EMFILE_EXC_THROWN;
            });
        });
    });
});
