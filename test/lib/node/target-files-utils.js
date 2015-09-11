var fs = require('fs');
var mockFs = require('mock-fs');
var vow = require('vow');
var path = require('path');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');
var Logger = require('../../../lib/logger');

describe('node/target files utils', function () {
    var nodeFullPath;
    var node;

    beforeEach(function () {
        var nodePath = path.join('path', 'to', 'node');
        var projectDir = path.resolve('path', 'to', 'project');
        nodeFullPath = path.join(projectDir, nodePath);

        var mockFsConfig = {};
        mockFsConfig[nodeFullPath] = {};
        mockFs(mockFsConfig);

        var makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
    });

    afterEach(function () {
        mockFs.restore();
    });

    describe('cleanTargetFile', function () {
        var filename = 'file.js';
        var filepath;
        var unlinkStub;

        before(function () {
            unlinkStub = sinon.stub(fs, 'unlinkSync');
        });

        beforeEach(function () {
            filepath = path.join(nodeFullPath, filename);
            node.setLogger(sinon.createStubInstance(Logger));
            fs.writeFileSync(filepath, 'module.exports = function () {};');
        });

        afterEach(function () {
            unlinkStub.reset();
        });

        after(function () {
            unlinkStub.restore();
        });

        it('should resolve path to target file', function () {
            var resolvePath = sinon.spy(node, 'resolvePath');

            node.cleanTargetFile(filename);

            expect(resolvePath).to.be.calledWith(filename);
        });

        it('should remove target file if it exists in node dir', function () {
            node.cleanTargetFile(filename);

            expect(unlinkStub).to.be.calledWith(filepath);
        });

        it('should log clean if target file was removed', function () {
            node.cleanTargetFile(filename);

            expect(node.getLogger().logClean).to.be.calledWith(filename);
        });

        it('should not remove file if it does not exist in node dir', function () {
            node.cleanTargetFile('missing_file.js');

            expect(unlinkStub).to.be.not.called;
        });

        it('should not log clean if target file does not exists in node dir', function () {
            node.cleanTargetFile('missing_file.js');

            expect(node.getLogger().logClean).to.be.not.called;
        });
    });

    describe('createTmpFileForTarget', function () {
        it('should return promise', function () {
            var result = node.createTmpFileForTarget('test_target.js');

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should create temp file for target', function () {
            return node.createTmpFileForTarget('test_target.js').then(function (filename) {
                expect(fs.existsSync(filename)).to.be.true;
            });
        });

        it('should build temp file name as _tmp_%time%%random_string%_%target_name%', function () {
            var regexp = new RegExp('_tmp_\\d{13,14}\\w{6,7}_' + 'test_target\\.js');

            return node.createTmpFileForTarget('test_target.js').then(function (filename) {
                expect(filename).to.match(regexp);
            });
        });
    });
});
