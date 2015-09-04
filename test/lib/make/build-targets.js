var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var MakePlatform = require('../../../lib/make');
var Node = require('../../../lib/node');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeConfig = require('../../../lib/config/node-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var Cache = require('../../../lib/cache/cache');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe.only('make/buildTargets', function () {
    var makePlatform;
    var sandbox = sinon.sandbox.create();
    var projectPath = path.normalize('/path/to/project');

    beforeEach(function (done) {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);
        sandbox.stub(Cache.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        makePlatform = new MakePlatform();
        makePlatform.init(projectPath, 'mode', function () {}).then(function () {
            done();
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        var result = makePlatform.buildTargets([path.normalize('path/to/node')]);

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should create cache', function () {
        var cacheStorage = sinon.createStubInstance(CacheStorage);
        var projectName = path.basename(projectPath);

        makePlatform.setCacheStorage(cacheStorage);
        makePlatform.buildTargets([path.normalize('path/to/node')]);

        expect(Cache.prototype.__constructor).to.be.calledWith(cacheStorage, projectName);
    });

    it('should return rejected promise if required target does not match any available node', function () {
        setup({
            nodePath: path.normalize('path/to/node')
        });

        return expect(makePlatform.buildTargets([path.normalize('path/to/another/node')]))
            .to.be.rejectedWith('Target not found: ' + path.normalize('path/to/another/node'));
    });

    it('should init node', function () {
        var initNode = sinon.spy(makePlatform, 'initNode');
        var nodePath = path.normalize('path/to/node');

        setup({ nodePath: nodePath });

        return makePlatform.buildTargets([nodePath]).then(function () {
            expect(initNode).to.be.calledOnce
                .and.to.be.calledWith(nodePath);
        });
    });

    it('should build all targets', function () {
        var nodePath = path.normalize('path/to/node');

        setup({ nodePath: nodePath });

        return makePlatform.buildTargets([nodePath]).then(function () {
            expect(Node.prototype.build).to.be.calledOnce;
        });
    });

    it('should build all possible node targets if passed targets are empty', function () {
        var nodePath = path.normalize('path/to/node');

        setup({ nodePath: nodePath });

        return makePlatform.buildTargets([]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['*']);
        });
    });

    it('should build all node targets if passed target is equal with node path', function () {
        var nodePath = path.normalize('path/to/node');

        setup({ nodePath: nodePath });

        return makePlatform.buildTargets([nodePath]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['*']);
        });
    });

    it('should build specific target if passed target is equal with node path and this target name', function () {
        setup({ nodePath: path.normalize('path/to/node') });

        return makePlatform.buildTargets([path.normalize('path/to/node/?.js')]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.js']);
        });
    });

    it('should force single node build multiple targets if multiple targets for single node passed', function () {
        var targets = [
            path.normalize('path/to/node/?.css'),
            path.normalize('path/to/node/?.js')
        ];

        setup({ nodePath: path.normalize('path/to/node') });

        return makePlatform.buildTargets(targets).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.css', '?.js']);
        });
    });

    it('should fulfill promise with built targets', function () {
        setup({
            nodePath: path.normalize('path/to/node'),
            nodeBuildResult: { builtTargets: ['?.js'] }
        });

        return expect(makePlatform.buildTargets([path.normalize('path/to/node/?.js')])).
            to.be.eventually.deep.equal({ builtTargets: ['?.js'] });
    });
});

function setup (settings) {
    var nodeConfigs = {};

    settings = settings || {};
    settings.nodePath = settings.nodePath || path.normalize('path/to/node');
    settings.nodeConfig = settings.nodeConfig || sinon.createStubInstance(NodeConfig);
    settings.nodeMaskConfig = settings.nodeMaskConfig || sinon.createStubInstance(NodeMaskConfig);
    settings.nodeBuildResult = settings.nodeBuildResult || {};

    nodeConfigs[settings.nodePath] = settings.nodeConfig;

    ProjectConfig.prototype.getNodeConfig.returns(settings.nodeConfig);
    ProjectConfig.prototype.getNodeConfigs.returns(nodeConfigs);
    ProjectConfig.prototype.getNodeMaskConfigs.returns([settings.nodeMaskConfig]);
    Node.prototype.build.returns(settings.nodeBuildResult);
}
