'use strict'

const fs = require('fs');
const path = require('path');

const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');

const Node = require('../../../lib/node/node');
const MakePlatform = require('../../../lib/make');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const NodeConfig = require('../../../lib/config/node-config');
const Cache = require('../../../lib/cache/cache');
const CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/cleanTarget', () => {
    let makePlatform;
    const sandbox = sinon.sandbox.create();
    const projectPath = '/path/to/project';

    beforeEach(done => {
        mockFs({});
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);
        sandbox.stub(Cache.prototype);

        sandbox.stub(fs, 'existsSync').returns(true);
        vowFs.makeDir.returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init(projectPath, 'mode', () => {}).then(done);
    });

    afterEach(() => {
        mockFs.restore();
        sandbox.restore();
    });

    it('should return promise', () => {
        const result = makePlatform.cleanTargets();

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should create cache', () => {
        const cacheStorage = sinon.createStubInstance(CacheStorage);
        const projectName = path.basename(projectPath);

        makePlatform.setCacheStorage(cacheStorage);
        makePlatform.cleanTargets();

        expect(Cache.prototype.__constructor).to.be.calledWith(cacheStorage, projectName);
    });

    it('should return rejected promise if required target does not match any available node', () => {
        setup({ nodePath: 'path/to/node' });

        return expect(makePlatform.cleanTargets(['path/to/another/node']))
            .to.be.rejectedWith('Target not found: path/to/another/node');
    });

    it('should init nodes', () => {
        const initNode = sinon.spy(makePlatform, 'initNode');

        setup({ nodePath: 'path/to/node' });

        return makePlatform.cleanTargets(['path/to/node']).then(() => {
            expect(initNode).to.be.calledOnce
                .and.to.be.calledWith('path/to/node');
        });
    });

    it('should build all targets', () => {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.cleanTargets(['path/to/node']).then(() => {
            expect(Node.prototype.clean).to.be.calledOnce;
        });
    });

    it('should build all possible node targets if passed targets are empty', () => {
        setup();

        return makePlatform.cleanTargets([]).then(() => {
            expect(Node.prototype.clean).to.be.calledWith(['*']);
        });
    });

    it('should build all node targets if passed target is equal with node path', () => {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.cleanTargets(['path/to/node']).then(() => {
            expect(Node.prototype.clean).to.be.calledWith(['*']);
        });
    });

    it('should build specific target if passed target is equal with node path and this target name', () => {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.cleanTargets(['path/to/node/?.js']).then(() => {
            expect(Node.prototype.clean).to.be.calledWith(['?.js']);
        });
    });

    it('should force single node build multiple targets if multiple targets for single node passed', () => {
        const targets = [
            'path/to/node/?.css',
            'path/to/node/?.js'
        ];

        setup({ nodePath: 'path/to/node' });

        return makePlatform.cleanTargets(targets).then(() => {
            expect(Node.prototype.clean).to.be.calledWith(['?.css', '?.js']);
        });
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
}
