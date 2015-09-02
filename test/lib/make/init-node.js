var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
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

describe.only('make/initNode', function () {
    var sandbox;
    var makePlatform;
    var nodeConfig;
    var modeConfig;
    var nodeMaskConfigs;

    before(function () {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(function () {
        var logger = sinon.createStubInstance(Logger);
        logger.subLogger.withArgs(path.normalize('path/to/node'))
            .returns(sinon.createStubInstance(Logger));

        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(Node.prototype);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(BuildGraph.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        modeConfig = sinon.createStubInstance(ModeConfig);
        nodeConfig = sinon.createStubInstance(NodeConfig);
        nodeConfig.getModeConfig.withArgs('mode').returns(modeConfig);
        nodeMaskConfigs = [sinon.createStubInstance(NodeMaskConfig)];

        ProjectConfig.prototype.getNodeConfig
            .withArgs(path.normalize('path/to/node')).returns(nodeConfig);
        ProjectConfig.prototype.getNodeMaskConfigs
            .withArgs(path.normalize('path/to/node')).returns(nodeMaskConfigs);

        makePlatform = new MakePlatform();
        makePlatform.init('/path/to/project', 'mode', function () {});
        makePlatform.setLogger(logger);
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        expect(makePlatform.initNode(path.normalize('path/to/node')))
            .to.be.instanceOf(vow.Promise);
    });

    it('should not start node initialization if it was already started', function () {
        makePlatform.initNode(path.normalize('path/to/node'));
        Node.prototype.__constructor.reset();
        makePlatform.initNode(path.normalize('path/to/node'));

        expect(Node.prototype.__constructor).to.be.not.called;
    });

    it('should get node config from project config', function () {
        makePlatform.initNode(path.normalize('path/to/node'));

        expect(ProjectConfig.prototype.getNodeConfig).to.be.calledWith(path.normalize('path/to/node'));
    });

    it('should create node', function () {
        makePlatform.buildTargets(); //creates cache in makePlatform

        makePlatform.initNode(path.normalize('path/to/node'));

        expect(Node.prototype.__constructor)
            .to.be.calledWith(path.normalize('path/to/node'), makePlatform, sinon.match.instanceOf(Cache));
    });

    it('should set node logger as sublogger of own logger', function () {
        var expectedLogger = makePlatform.getLogger().subLogger(path.normalize('path/to/node'));

        makePlatform.initNode(path.normalize('path/to/node'));

        expect(Node.prototype.setLogger).to.be.calledWith(expectedLogger);
    });

    it('should set node build graph as own build graph', function () {
        makePlatform.initNode(path.normalize('path/to/node'));

        expect(Node.prototype.setBuildGraph).to.be.calledWith(makePlatform.getBuildGraph());
    });

    it('should create node dir', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(vowFs.makeDir).to.be.calledWith(path.normalize('/path/to/project/path/to/node'));
        });
    });

    it('should execute node config', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(nodeConfig.exec)
                .to.be.called;
        });
    });

    it('should return rejected promise if project config does not have node config for requested node', function () {
        return expect(makePlatform.initNode(path.normalize('path/to/another/node'))).to.be.rejected;
    });

    it('should execute all node mask configs', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            nodeMaskConfigs.forEach(function (config) {
                expect(config.exec).to.be.called;
            });
        });
    });

    it('should pass node config to node mask configs as context', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            nodeMaskConfigs.forEach(function (config) {
                expect(config.exec).to.be.calledWith(sinon.match.any, nodeConfig);
            });
        });
    });

    it('should execute mode config', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(modeConfig.exec).to.be.called;
        });
    });

    it('should pass node config to mode config as context', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(modeConfig.exec).to.be.calledWith(sinon.match.any, nodeConfig);
        });
    });

    it('should set node languages as node config languages if languages available from node config', function () {
        nodeConfig.getLanguages.returns(['ru']);

        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.setLanguages).to.be.calledWith(['ru']);
        });
    });

    it('should set node languages as make platform languages if languages are not available from node ' +
        'config', function () {
        makePlatform.setLanguages(['ru']);

        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.setLanguages).to.be.calledWith(['ru']);
        });
    });

    it('should set node targets to build as targets to build from node config', function () {
        nodeConfig.getTargets.returns(['?.js']);

        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.setTargetsToBuild).to.be.calledWith(['?.js']);
        });
    });

    it('should set node targets to clean as targets to clean from node config', function () {
        nodeConfig.getCleanTargets.returns(['?.js']);

        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.setTargetsToClean).to.be.calledWith(['?.js']);
        });
    });

    it('should set node techs as techs from node config', function () {
        var tech = sinon.createStubInstance(BaseTech);
        nodeConfig.getTechs.returns([tech]);

        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.setTechs).to.be.calledWith([tech]);
        });
    });

    it('should set node build state', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.setBuildState).to.be.calledWith({});
        });
    });

    it('should force node to load techs', function () {
        return makePlatform.initNode(path.normalize('path/to/node')).then(function () {
            expect(Node.prototype.loadTechs).to.be.called;
        });
    });
});
