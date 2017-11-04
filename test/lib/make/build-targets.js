'use strict'

const fs = require('fs');
const path = require('path');
const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');
const MakePlatform = require('../../../lib/make');
const Node = require('../../../lib/node/node');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeConfig = require('../../../lib/config/node-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const Cache = require('../../../lib/cache/cache');
const CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/buildTargets', function () {
    let makePlatform;
    const sandbox = sinon.sandbox.create();
    const projectPath = '/path/to/project';

    beforeEach(function (done) {
        mockFs({});
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);
        sandbox.stub(Cache.prototype);

        sandbox.stub(fs, 'existsSync').returns(true);
        vowFs.makeDir.returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init(projectPath, 'mode', function () {}).then(done);
    });

    afterEach(function () {
        mockFs.restore();
        sandbox.restore();
    });

    it('should return promise', function () {
        const result = makePlatform.buildTargets();

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should create cache', function () {
        const cacheStorage = sinon.createStubInstance(CacheStorage);
        const projectName = path.basename(projectPath);

        makePlatform.setCacheStorage(cacheStorage);
        makePlatform.buildTargets(['path/to/node']);

        expect(Cache.prototype.__constructor).to.be.calledWith(cacheStorage, projectName);
    });

    it('should return rejected promise if required target does not match any available node', function () {
        setup({ nodePath: 'path/to/node' });

        return expect(makePlatform.buildTargets(['path/to/another/node']))
            .to.be.rejectedWith('Target not found: path/to/another/node');
    });

    it('should init node', function () {
        const initNode = sinon.spy(makePlatform, 'initNode');

        setup({ nodePath: 'path/to/node' });

        return makePlatform.buildTargets(['path/to/node']).then(function () {
            expect(initNode).to.be.calledOnce
                .and.to.be.calledWith('path/to/node');
        });
    });

    it('should start building targets of required node', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.buildTargets(['path/to/node']).then(function () {
            expect(Node.prototype.build).to.be.calledOnce;
        });
    });

    it('should build all possible node targets if passed targets are empty', function () {
        setup();

        return makePlatform.buildTargets([]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['*']);
        });
    });

    it('should build all node targets if passed target is equal with node path', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.buildTargets(['path/to/node']).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['*']);
        });
    });

    it('should build specific target if passed target is equal with node path and its target name', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.buildTargets(['path/to/node/?.js']).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.js']);
        });
    });

    it('should force single node build multiple targets if multiple targets for single node passed', function () {
        const targets = [
            'path/to/node/?.css',
            'path/to/node/?.js'
        ];

        setup({ nodePath: 'path/to/node' });

        return makePlatform.buildTargets(targets).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.css', '?.js']);
        });
    });

    it('should fulfill promise with built targets', function () {
        setup({ nodePath: 'path/to/node' });
        Node.prototype.build.returns({ builtTargets: ['?.js'] });

        return expect(makePlatform.buildTargets(['path/to/node/?.js'])).
            to.be.eventually.deep.equal({ builtTargets: ['?.js'] });
    });
});

function setup (settings) {
    const nodeConfigs = {};
    const defaults = { nodePath: 'default/path' };

    settings = Object.assign({}, defaults, settings);

    nodeConfigs[settings.nodePath] = sinon.createStubInstance(NodeConfig);

    ProjectConfig.prototype.getNodeConfig
        .withArgs(settings.nodePath).returns(sinon.createStubInstance(NodeConfig));
    ProjectConfig.prototype.getNodeConfigs
        .returns(nodeConfigs);
    ProjectConfig.prototype.getNodeMaskConfigs
        .withArgs(settings.nodePath).returns([sinon.createStubInstance(NodeMaskConfig)]);

    Node.prototype.build.returns({});
}
