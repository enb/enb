'use strict';

var path = require('path');
var nodeFactory = require('../../../lib/node');
var MakePlatform = require('../../../lib/make');
var Cache = require('../../../lib/cache/cache');

describe('node/path utils', function () {
    var nodePath = path.join('path', 'to', 'node');
    var projectDir = path.join('path', 'to', 'project');
    var node;

    beforeEach(function () {
        var makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
    });

    describe('resolvePath', function () {
        it('should return absolute path to file in node directory', function () {
            expect(node.resolvePath('test_file.js'))
                .to.be.equal(path.resolve(projectDir, nodePath) + path.sep + 'test_file.js');
        });
    });

    describe('resolveNodePath', function () {
        it('should return absolute path to file in provided node directory', function () {
            var pathToAnotherNode = path.join('path', 'to', 'another', 'node');
            var filename = 'test_file.js';
            var expectedPath = path.join(projectDir, pathToAnotherNode, filename);

            expect(node.resolveNodePath(pathToAnotherNode, filename)).to.be.equal(expectedPath);
        });
    });

    describe('unmaskNodeTargetName', function () {
        it('should unmask target name with node basename', function () {
            expect(node.unmaskNodeTargetName(nodePath, '?.js')).to.be.equal('node.js');
        });

        it('should return same target name if it does not contain ? signs', function () {
            expect(node.unmaskNodeTargetName(nodePath, 'target.js')).to.be.equal('target.js');
        });
    });

    describe('relativePath', function () {
        it('should return path to file relative to node path', function () {
            var filePath = path.join(projectDir, 'file.js');
            var expectedPath = '../../../file.js';

            expect(node.relativePath(filePath)).to.be.equal(expectedPath);
        });

        it('should replace back slashes with forward slashes in result', function () {
            var relativePath = 'some\\path\\file.js';
            var filePath = path.join(projectDir, relativePath);
            var expectedPath = '../../../some/path/file.js';

            expect(node.relativePath(filePath)).to.be.equal(expectedPath);
        });

        it('should prepend result with ./ if file located in node dir', function () {
            var relativePath = path.join(projectDir, nodePath, 'file.js');

            expect(node.relativePath(relativePath)).to.be.equal('./file.js');
        });

        it('should prepend result with ./ if file located in directory located in node dir', function () {
            var relativePath = path.join(projectDir, nodePath, 'dir', 'file.js');

            expect(node.relativePath(relativePath)).to.be.equal('./dir/file.js');
        });
    });

    describe('wwwRootPath', function () {
        var filename = 'file.js';
        var filepath;

        beforeEach(function () {
            filepath = path.join(projectDir, filename);
        });

        it('should return path to file as www root plus filename relative to project root', function () {
            var wwwRoot = path.join(projectDir, 'www_root/');
            var expectedPath = path.join(wwwRoot, filename);
            var result = node.wwwRootPath(filepath, wwwRoot);

            expect(result).to.be.equal(expectedPath);
        });

        it('should use root path if wwwRoot was not provided', function () {
            var expectedPath = '/file.js';
            var result = node.wwwRootPath(filepath);

            expect(result).to.be.equal(expectedPath);
        });
    });
});
