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

describe('make/buildTargets', function () {
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
        sandbox.stub(Cache.prototype);

        fs.existsSync.returns(true);
        vowFs.makeDir.returns(vow.fulfill());

        ProjectConfig.prototype.getNodeConfig.returns(fakeNodeConfig);
        ProjectConfig.prototype.getNodeConfigs.returns(fakeNodeConfigs);
        ProjectConfig.prototype.getNodeMaskConfigs.returns([sinon.createStubInstance(NodeMaskConfig)]);
        Node.prototype.build.returns({ builtTargets: ['?.js'] });

        makePlatform = new MakePlatform();
        makePlatform.init(path.normalize('/path/to/project'), 'mode', function () {}).then(function () {
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

        makePlatform.setCacheStorage(cacheStorage);
        makePlatform.buildTargets([path.normalize('path/to/node')]);

        expect(Cache.prototype.__constructor).to.be.calledWith(cacheStorage, 'project');
    });

    it('should return rejected promise if required target does not match any available node', function () {
        return expect(makePlatform.buildTargets([path.normalize('path/to/another/node')]))
            .to.be.rejectedWith('Target not found: ' + path.normalize('path/to/another/node'));
    });

    it('should init all nodes', function () {
        var initNode = sinon.spy(makePlatform, 'initNode');

        return makePlatform.buildTargets([path.normalize('path/to/node')]).then(function () {
            expect(initNode).to.be.calledOnce
                .and.to.be.calledWith(path.normalize('path/to/node'));
        });
    });

    it('should build all targets', function () {
        return makePlatform.buildTargets([path.normalize('path/to/node')]).then(function () {
            expect(Node.prototype.build).to.be.calledOnce;
        });
    });

    it('should build all possible node targets if passed targets are empty', function () {
        return makePlatform.buildTargets([]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['*']);
        });
    });

    it('should build all node targets if passed target is equal with node path', function () {
        return makePlatform.buildTargets([path.normalize('path/to/node')]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['*']);
        });
    });

    it('should build specific target if passed target is equal with node path and this target name', function () {
        return makePlatform.buildTargets([path.normalize('path/to/node/?.js')]).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.js']);
        });
    });

    it('should force single node build multiple targets if multiple targets for single node passed', function () {
        var targets = [
            path.normalize('path/to/node/?.css'),
            path.normalize('path/to/node/?.js')
        ];

        return makePlatform.buildTargets(targets).then(function () {
            expect(Node.prototype.build).to.be.calledWith(['?.css', '?.js']);
        });
    });

    it('should fulfill promise with built targets', function () {
        return expect(makePlatform.buildTargets([path.normalize('path/to/node/?.js')])).
            to.be.eventually.deep.equal({ builtTargets: ['?.js'] });
    });
});
