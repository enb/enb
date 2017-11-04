'use strict'

const fs = require('fs');
const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');
const MakePlatform = require('../../../lib/make');
const Node = require('../../../lib/node/node');
const NodeConfig = require('../../../lib/config/node-config');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const Logger = require('../../../lib/logger');

describe('make/requireNodeSources', function () {
    let makePlatform;
    let sandbox;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function (done) {
        mockFs({});

        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);

        sandbox.stub(fs, 'existsSync').returns(true);
        sandbox.stub(vowFs, 'makeDir').returns(vow.fulfill());

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {}).then(done);
        makePlatform.setLogger(sinon.createStubInstance(Logger));
    });

    afterEach(function () {
        mockFs.restore();
        sandbox.restore();
    });

    it('should return promise', function () {
        const result = makePlatform.requireNodeSources('path/to/node');

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should init required node', function () {
        const initNode = sinon.spy(makePlatform, 'initNode');

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
    const defaults = { nodePath: 'default/path' };

    settings = Object.assign({}, defaults, settings);

    ProjectConfig.prototype.getNodeConfig
        .withArgs(settings.nodePath).returns(sinon.createStubInstance(NodeConfig));
    ProjectConfig.prototype.getNodeMaskConfigs
        .withArgs(settings.nodePath).returns([sinon.createStubInstance(NodeMaskConfig)]);
}
