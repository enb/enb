'use strict'

const fs = require('fs');
const path = require('path');
const vow = require('vow');
const vowFs = require('vow-fs');
const mockFs = require('mock-fs');
const Node = require('../../../lib/node/node');
const nodeFactory = require('../../../lib/node');
const ProjectConfig = require('../../../lib/config/project-config');
const NodeConfig = require('../../../lib/config/node-config');
const NodeMaskConfig = require('../../../lib/config/node-mask-config');
const ModeConfig = require('../../../lib/config/mode-config');
const Logger = require('../../../lib/logger');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const BaseTech = require('../../../lib/tech/base-tech');

describe('make/initNode', function () {
    const sandbox = sinon.sandbox.create();
    let makePlatform;
    let node;

    beforeEach(function () {
        mockFs({});

        sandbox.stub(vowFs);
        sandbox.stub(nodeFactory);
        sandbox.stub(ProjectConfig.prototype);

        node = sinon.createStubInstance(Node);
        nodeFactory.mkNode.returns(node);

        sandbox.stub(fs, 'existsSync').returns(true);

        vowFs.makeDir.returns(vow.fulfill()); // prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {}, { graph: true });
    });

    afterEach(function () {
        mockFs.restore();
        sandbox.restore();
    });

    it('should return promise', function () {
        expect(makePlatform.initNode('path/to/node'))
            .to.be.instanceOf(vow.Promise);
    });

    it('should not start node initialization if it was already started', function () {
        makePlatform.initNode('path/to/node');
        makePlatform.initNode('path/to/node');

        expect(nodeFactory.mkNode).to.be.calledOnce;
    });

    it('should get node config from project config', function () {
        makePlatform.initNode('path/to/node');

        expect(ProjectConfig.prototype.getNodeConfig).to.be.calledWith('path/to/node');
    });

    it('should create node', function () {
        makePlatform.buildTargets(); // creates cache in makePlatform

        makePlatform.initNode('path/to/node');

        expect(nodeFactory.mkNode)
            .to.be.calledWith('path/to/node', makePlatform, sinon.match.instanceOf(Cache),
                makePlatform.getBuildGraph());
    });

    it('should set node logger as sublogger of own logger', function () {
        const logger = sinon.createStubInstance(Logger);
        const expectedLogger = sinon.createStubInstance(Logger);

        logger.subLogger.withArgs('path/to/node').returns(expectedLogger);
        setup({ nodePath: 'path/to/node' });
        makePlatform.setLogger(logger);

        makePlatform.initNode('path/to/node');

        expect(node.setLogger).to.be.calledWith(expectedLogger);
    });

    it('should create node dir', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(vowFs.makeDir).to.be.calledWith(path.normalize(`${makePlatform.getDir()}/path/to/node`));
        });
    });

    it('should execute node config', function () {
        const nodeConfig = sinon.createStubInstance(NodeConfig);

        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(nodeConfig.exec)
                .to.be.called;
        });
    });

    it('should return rejected promise if project config does not have node config for requested node', function () {
        setup({ nodePath: 'path/to/node' });

        return expect(makePlatform.initNode('path/to/another/node')).to.be.rejected;
    });

    it('should execute node mask config and pass it node config as context', function () {
        const nodeMaskConfig = sinon.createStubInstance(NodeMaskConfig);
        const nodeConfig = sinon.createStubInstance(NodeConfig);

        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });
        ProjectConfig.prototype.getNodeMaskConfigs
            .withArgs('path/to/node').returns([nodeMaskConfig]);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(nodeMaskConfig.exec).to.be.calledWith(sinon.match.any, nodeConfig);
        });
    });

    it('should execute mode config and pass it node config as context', function () {
        const modeConfig = sinon.createStubInstance(ModeConfig);
        const nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getModeConfig
            .withArgs('mode').returns(modeConfig);

        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(modeConfig.exec).to.be.calledWith(sinon.match.any, nodeConfig);
        });
    });

    it('should set node languages as node config languages if languages available from node config', function () {
        const nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getLanguages.returns(['ru']);
        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.setLanguages).to.be.calledWith(['ru']);
        });
    });

    it('should set node languages as make platform languages if languages are not available from node ' +
        'config', function () {
        makePlatform.setLanguages(['ru']);
        setup({ nodePath: 'path/to/node' });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.setLanguages).to.be.calledWith(['ru']);
        });
    });

    it('should set node targets to build as targets to build from node config', function () {
        const nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getTargets.returns(['?.js']);
        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.setTargetsToBuild).to.be.calledWith(['?.js']);
        });
    });

    it('should set node targets to clean as targets to clean from node config', function () {
        const nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getCleanTargets.returns(['?.js']);
        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.setTargetsToClean).to.be.calledWith(['?.js']);
        });
    });

    it('should set node techs as techs from node config', function () {
        const nodeConfig = sinon.createStubInstance(NodeConfig);
        const tech = sinon.createStubInstance(BaseTech);

        nodeConfig.getTechs.returns([tech]);
        setup({
            nodePath: 'path/to/node',
            nodeConfig
        });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.setTechs).to.be.calledWith([tech]);
        });
    });

    it('should set node build state', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.setBuildState).to.be.calledWith({});
        });
    });

    it('should force node to load techs', function () {
        setup({ nodePath: 'path/to/node' });

        return makePlatform.initNode('path/to/node').then(function () {
            expect(node.loadTechs).to.be.called;
        });
    });
});

function setup (params) {
    const defaults = {
        nodePath: 'default/path',
        nodeConfig: sinon.createStubInstance(NodeConfig),
        nodeMaskConfig: sinon.createStubInstance(NodeMaskConfig)
    };

    params = Object.assign({}, defaults, params);

    ProjectConfig.prototype.getNodeConfig
        .withArgs(params.nodePath).returns(params.nodeConfig);
    ProjectConfig.prototype.getNodeMaskConfigs
        .withArgs(params.nodePath).returns([params.nodeMaskConfig]);
}
