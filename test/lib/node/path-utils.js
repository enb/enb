'use strict';

const path = require('path');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');

describe('node/path utils', function () {
    const nodePath = path.join('path', 'to', 'node');
    const projectDir = path.join('path', 'to', 'project');
    let node;

    beforeEach(function () {
        const makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
    });

    describe('resolvePath', function () {
        it('should return absolute path to file in node directory', function () {
            expect(node.resolvePath('test_file.js'))
                .to.be.equal(`${path.resolve(projectDir, nodePath)}${path.sep}test_file.js`);
        });
    });

    describe('resolveNodePath', function () {
        it('should return absolute path to file in provided node directory', function () {
            const pathToAnotherNode = path.join('path', 'to', 'another', 'node');
            const filename = 'test_file.js';
            const expectedPath = path.join(projectDir, pathToAnotherNode, filename);

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
            const filePath = path.join(projectDir, 'file.js');
            const expectedPath = '../../../file.js';

            expect(node.relativePath(filePath)).to.be.equal(expectedPath);
        });

        it('should replace back slashes with forward slashes in result', function () {
            const relativePath = 'some\\path\\file.js';
            const filePath = path.join(projectDir, relativePath);
            const expectedPath = '../../../some/path/file.js';

            expect(node.relativePath(filePath)).to.be.equal(expectedPath);
        });

        it('should prepend result with ./ if file located in node dir', function () {
            const relativePath = path.join(projectDir, nodePath, 'file.js');

            expect(node.relativePath(relativePath)).to.be.equal('./file.js');
        });

        it('should prepend result with ./ if file located in directory located in node dir', function () {
            const relativePath = path.join(projectDir, nodePath, 'dir', 'file.js');

            expect(node.relativePath(relativePath)).to.be.equal('./dir/file.js');
        });
    });

    describe('wwwRootPath', function () {
        const filename = 'file.js';
        let filepath;

        beforeEach(function () {
            filepath = path.join(projectDir, filename);
        });

        it('should return path to file as www root plus filename relative to project root', function () {
            const wwwRoot = path.join(projectDir, 'www_root/');
            const expectedPath = path.join(wwwRoot, filename);
            const result = node.wwwRootPath(filepath, wwwRoot);

            expect(result).to.be.equal(expectedPath);
        });

        it('should use root path if wwwRoot was not provided', function () {
            const expectedPath = '/file.js';
            const result = node.wwwRootPath(filepath);

            expect(result).to.be.equal(expectedPath);
        });
    });
});
