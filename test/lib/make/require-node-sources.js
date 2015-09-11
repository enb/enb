var fs = require('fs');
var vow = require('vow');
var vowFs = require('vow-fs');
var _ = require('lodash');
var MakePlatform = require('../../../lib/make');
var Node = require('../../../lib/node/node');
var NodeConfig = require('../../../lib/config/node-config');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var Logger = require('../../../lib/logger');

describe('make/requireNodeSources', function () {
    var makePlatform;
    var sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function (done) {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {}).then(done);
        makePlatform.setLogger(sinon.createStubInstance(Logger));
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        var result = makePlatform.requireNodeSources('path/to/node');

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should init required node', function () {
        var initNode = sinon.spy(makePlatform, 'initNode');

        makePlatform.requireNodeSources('path/to/node');

        expect(initNode).to.be.calledWith('path/to/node');
    });

    it('should require sources from initialized node', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.requireNodeSources('path/to/node').then(function () {
            expect(Node.prototype.requireSources).to.be.called;
        });
    });

    it('should pass required targets to node when require sources from it', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.requireNodeSources('path/to/node', ['?.js']).then(function () {
            expect(Node.prototype.requireSources).to.be.calledWith(['?.js']);
        });
    });
});

function setup (settings) {
    settings = settings || {};
    _.defaults(settings, { nodePath: 'default/path' });

    ProjectConfig.prototype.getNodeConfig
        .withArgs(settings.nodePath).returns(sinon.createStubInstance(NodeConfig));
    ProjectConfig.prototype.getNodeMaskConfigs
        .withArgs(settings.nodePath).returns([sinon.createStubInstance(NodeMaskConfig)]);
}
