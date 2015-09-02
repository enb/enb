var fs = require('fs');
var path = require('path');
var vow = require('vow');
var vowFs = require('vow-fs');
var Node = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var ProjectConfig = require('../../../lib/config/project-config');
var NodeMaskConfig = require('../../../lib/config/node-mask-config');
var NodeConfig = require('../../../lib/config/node-config');
var Cache = require('../../../lib/cache/cache');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('make/cleanTarget', function () {
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

        makePlatform = new MakePlatform();
        makePlatform.init(path.normalize('/path/to/project'), 'mode', function () {}).then(function () {
            done();
        });
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should return promise', function () {
        var result = makePlatform.cleanTargets();

        expect(result).to.be.instanceOf(vow.Promise);
    });

    it('should create cache', function () {
        var cacheStorage = sinon.createStubInstance(CacheStorage);

        makePlatform.setCacheStorage(cacheStorage);
        makePlatform.cleanTargets();

        expect(Cache.prototype.__constructor).to.be.calledWith(cacheStorage, 'project');
    });

    it('should return rejected promise if required target does not match any available node', function () {
        return expect(makePlatform.cleanTargets([path.normalize('path/to/another/node')]))
            .to.be.rejectedWith('Target not found: ' + path.normalize('path/to/another/node'));
    });

    it('should init all nodes', function () {
        var initNode = sinon.spy(makePlatform, 'initNode');

        return makePlatform.cleanTargets([path.normalize('path/to/node')]).then(function () {
            expect(initNode).to.be.calledOnce
                .and.to.be.calledWith(path.normalize('path/to/node'));
        });
    });

    it('should build all targets', function () {
        return makePlatform.cleanTargets([path.normalize('path/to/node')]).then(function () {
            expect(Node.prototype.clean).to.be.calledOnce;
        });
    });

    it('should build all possible node targets if passed targets are empty', function () {
        return makePlatform.cleanTargets([]).then(function () {
            expect(Node.prototype.clean).to.be.calledWith(['*']);
        });
    });

    it('should build all node targets if passed target is equal with node path', function () {
        return makePlatform.cleanTargets([path.normalize('path/to/node')]).then(function () {
            expect(Node.prototype.clean).to.be.calledWith(['*']);
        });
    });

    it('should build specific target if passed target is equal with node path and this target name', function () {
        return makePlatform.cleanTargets([path.normalize('path/to/node/?.js')]).then(function () {
            expect(Node.prototype.clean).to.be.calledWith(['?.js']);
        });
    });

    it('should force single node build multiple targets if multiple targets for single node passed', function () {
        var targets = [
            path.normalize('path/to/node/?.css'),
            path.normalize('path/to/node/?.js')
        ];

        return makePlatform.cleanTargets(targets).then(function () {
            expect(Node.prototype.clean).to.be.calledWith(['?.css', '?.js']);
        });
    });
});
