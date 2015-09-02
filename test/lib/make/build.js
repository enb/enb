var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var NodeConfig = require('../../../lib/config/node-config');

describe('make/build', function () {
    var makePlatform;
    var sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function (done) {
        var fakeNodeConfigs = {};
        var nodePath = path.normalize('path/to/node');
        var fakeNodeConfig = sinon.createStubInstance(NodeConfig);

        fakeNodeConfigs[nodePath] = fakeNodeConfig;

        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        ProjectConfig.prototype.getNodeConfig.returns(fakeNodeConfig);
        ProjectConfig.prototype.getNodeConfigs.returns(fakeNodeConfigs);
        ProjectConfig.prototype.getNodeMaskConfigs.returns([sinon.createStubInstance(NodeMaskConfig)]);

        makePlatform = new MakePlatform();
        makePlatform.init(path.normalize('/path/to/project'), 'mode', function () {
        }).then(function () {
            done();
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        var result = makePlatform.build([]);

        expect(result).to.be.instanceOf(vow.Promise);
    });
});
