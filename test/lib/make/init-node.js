var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var _ = require('lodash');
var Node = require('../../../lib/node');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeConfig = require('../../../lib/config/node-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var ModeConfig = require('../../../lib/config/mode-config');
var Logger = require('../../../lib/logger');
var MakePlatform = require('../../../lib/make');
var BuildGraph = require('../../../lib/ui/build-graph');
var Cache = require('../../../lib/cache/cache');
var BaseTech = require('../../../lib/tech/base-tech');

describe('make/initNode', function () {
    var sandbox = sinon.sandbox.create();
    var makePlatform;

    beforeEach(function () {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(Node.prototype);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(BuildGraph.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill()); //prevent temp dir creation on MakePlatform.init()

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {});
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        expect(makePlatform.initNode('path/to/node'))
            .to.be.instanceOf(vow.Promise);
    });

    it('should not start node initialization if it was already started', function () {
        makePlatform.initNode('path/to/node');
        Node.prototype.__constructor.reset();
        makePlatform.initNode('path/to/node');

        expect(Node.prototype.__constructor).to.be.not.called;
    });

    it('should get node config from project config', function () {
        makePlatform.initNode('path/to/node');

        expect(ProjectConfig.prototype.getNodeConfig).to.be.calledWith('path/to/node');
    });

    it('should create node', function () {
        makePlatform.buildTargets(); //creates cache in makePlatform

        makePlatform.initNode('path/to/node');

        expect(Node.prototype.__constructor)
            .to.be.calledWith('path/to/node', makePlatform, sinon.match.instanceOf(Cache));
    });

    it('should set node logger as sublogger of own logger', function () {
        var logger = sinon.createStubInstance(Logger);
        var expectedLogger = sinon.createStubInstance(Logger);

        logger.subLogger.withArgs('path/to/node').returns(expectedLogger);
        setup({ logger: logger }, makePlatform);
        makePlatform.initNode('path/to/node');

        expect(Node.prototype.setLogger).to.be.calledWith(expectedLogger);
    });

    it('should set node build graph as own build graph', function () {
        makePlatform.initNode('path/to/node');

        expect(Node.prototype.setBuildGraph).to.be.calledWith(makePlatform.getBuildGraph());
    });

    it('should create node dir', function () {
        setup({ nodePath: 'path/to/node' }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(vowFs.makeDir).to.be.calledWith(path.normalize('/path/to/project/path/to/node'));
        });
    });

    it('should execute node config', function () {
        var nodeConfig = sinon.createStubInstance(NodeConfig);

        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(nodeConfig.exec)
                .to.be.called;
        });
    });

    it('should return rejected promise if project config does not have node config for requested node', function () {
        setup({
            nodePath: 'path/to/node',
            nodeConfig: sinon.createStubInstance(NodeConfig)

        }, makePlatform);

        return expect(makePlatform.initNode('path/to/another/node')).to.be.rejected;
    });

    it('should execute node mask config', function () {
        var nodeMaskConfig = sinon.createStubInstance(NodeMaskConfig);

        setup({
            nodePath: 'path/to/node',
            nodeMaskConfig: nodeMaskConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(nodeMaskConfig.exec).to.be.called;
        });
    });

    it('should pass node config to node mask configs as context', function () {
        var nodeMaskConfig = sinon.createStubInstance(NodeMaskConfig);
        var nodeConfig = sinon.createStubInstance(NodeConfig);

        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig,
            nodeMaskConfig: nodeMaskConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(nodeMaskConfig.exec).to.be.calledWith(sinon.match.any, nodeConfig);
        });
    });

    it('should execute mode config', function () {
        var modeConfig = sinon.createStubInstance(ModeConfig);

        setup({
            nodePath: 'path/to/node',
            modeConfig: modeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(modeConfig.exec).to.be.called;
        });
    });

    it('should pass node config to mode config as context', function () {
        var modeConfig = sinon.createStubInstance(ModeConfig);
        var nodeConfig = sinon.createStubInstance(NodeConfig);

        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig,
            modeConfig: modeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(modeConfig.exec).to.be.calledWith(sinon.match.any, nodeConfig);
        });
    });

    it('should set node languages as node config languages if languages available from node config', function () {
        var nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getLanguages.returns(['ru']);
        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.setLanguages).to.be.calledWith(['ru']);
        });
    });

    it('should set node languages as make platform languages if languages are not available from node ' +
        'config', function () {
        makePlatform.setLanguages(['ru']);
        setup({ nodePath: 'path/to/node'}, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.setLanguages).to.be.calledWith(['ru']);
        });
    });

    it('should set node targets to build as targets to build from node config', function () {
        var nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getTargets.returns(['?.js']);
        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.setTargetsToBuild).to.be.calledWith(['?.js']);
        });
    });

    it('should set node targets to clean as targets to clean from node config', function () {
        var nodeConfig = sinon.createStubInstance(NodeConfig);

        nodeConfig.getCleanTargets.returns(['?.js']);
        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.setTargetsToClean).to.be.calledWith(['?.js']);
        });
    });

    it('should set node techs as techs from node config', function () {
        var nodeConfig = sinon.createStubInstance(NodeConfig);
        var tech = sinon.createStubInstance(BaseTech);

        nodeConfig.getTechs.returns([tech]);
        setup({
            nodePath: 'path/to/node',
            nodeConfig: nodeConfig

        }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.setTechs).to.be.calledWith([tech]);
        });
    });

    it('should set node build state', function () {
        setup({ nodePath: 'path/to/node' }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.setBuildState).to.be.calledWith({});
        });
    });

    it('should force node to load techs', function () {
        setup({ nodePath: 'path/to/node' }, makePlatform);

        return makePlatform.initNode('path/to/node').then(function () {
            expect(Node.prototype.loadTechs).to.be.called;
        });
    });
});

function setup (params, makePlatform) {
    _.defaults(params, {
        nodePath: 'path/to/node',
        nodeConfig: sinon.createStubInstance(NodeConfig),
        modeConfig: sinon.createStubInstance(ModeConfig),
        nodeMaskConfig: sinon.createStubInstance(NodeMaskConfig),
        logger: sinon.createStubInstance(Logger)
    });

    params.nodeConfig.getModeConfig
        .withArgs('mode').returns(params.modeConfig);

    ProjectConfig.prototype.getNodeConfig
        .withArgs(params.nodePath).returns(params.nodeConfig);
    ProjectConfig.prototype.getNodeMaskConfigs
        .withArgs(params.nodePath).returns([params.nodeMaskConfig]);

    makePlatform.setLogger(params.logger);
}
