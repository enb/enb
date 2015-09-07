var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var _ = require('lodash');
var MakePlatform = require('../../../lib/make');
var Node = require('../../../lib/node');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeConfig = require('../../../lib/config/node-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var Cache = require('../../../lib/cache/cache');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/buildTargets', function () {
    var makePlatform;
    var sandbox = sinon.sandbox.create();
    var projectPath = '/path/to/project';

    beforeEach(function (done) {
        sandbox.stub(fs);
        sandbox.stub(vowFs);
        sandbox.stub(ProjectConfig.prototype);
        sandbox.stub(Node.prototype);
        sandbox.stub(Cache.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        makePlatform = new MakePlatform();
        makePlatform.init(projectPath, 'mode', function () {}).then(done);
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        var result = makePlatform.buildTargets();

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should create cache', function () {
        var cacheStorage = sinon.createStubInstance(CacheStorage);
        var projectName = path.basename(projectPath);

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
        var initNode = sinon.spy(makePlatform, 'initNode');

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
        setup({ nodePath: 'path/to/node' });

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
        var targets = [
            'path/to/node/?.css',
            'path/to/node/?.js'
        ];

        setup({ nodePath: 'path/to/node' });

        return makePlatform.buildTargets(targets).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.css', '?.js']);
        });
    });

    it('should fulfill promise with built targets', function () {
        setup({
            nodePath: 'path/to/node',
            nodeBuildResult: { builtTargets: ['?.js'] }
        });

        return expect(makePlatform.buildTargets(['path/to/node/?.js'])).
            to.be.eventually.deep.equal({ builtTargets: ['?.js'] });
    });
});

function setup (settings) {
    var nodeConfigs = {};

    _.defaults(settings, {
        nodePath: 'path/to/node',
        nodeBuildResult: {}
    });

    nodeConfigs[settings.nodePath] = sinon.createStubInstance(NodeConfig);

    ProjectConfig.prototype.getNodeConfig.returns(sinon.createStubInstance(NodeConfig));
    ProjectConfig.prototype.getNodeConfigs.returns(nodeConfigs);
    ProjectConfig.prototype.getNodeMaskConfigs.returns([sinon.createStubInstance(NodeMaskConfig)]);

    Node.prototype.build.returns(settings.nodeBuildResult);
}
