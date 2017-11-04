'use strict';

const fs = require('fs');
// var process = require('process');
const mockFs = require('mock-fs');
const vow = require('vow');
const path = require('path');
const nodeFactory = require('../../../lib/node');
const MakePlatform = require('../../../lib/make');
const Cache = require('../../../lib/cache/cache');
const Logger = require('../../../lib/logger');

describe('node/target files utils', () => {
    let nodeFullPath;
    let node;

    beforeEach(() => {
        const nodePath = path.join('path', 'to', 'node');
        const projectDir = path.resolve('path', 'to', 'project');
        nodeFullPath = path.join(projectDir, nodePath);

        const mockFsConfig = {};
        mockFsConfig[nodeFullPath] = {};
        mockFs(mockFsConfig);

        const makePlatform = sinon.createStubInstance(MakePlatform);
        makePlatform.getDir.returns(projectDir);

        node = nodeFactory.mkNode(nodePath, makePlatform, sinon.createStubInstance(Cache));
    });

    afterEach(() => {
        mockFs.restore();
    });

    describe('cleanTargetFile', () => {
        const filename = 'file.js';
        let filepath;
        let unlinkStub;

        before(() => {
            unlinkStub = sinon.stub(fs, 'unlinkSync');
        });

        beforeEach(() => {
            filepath = path.join(nodeFullPath, filename);
            node.setLogger(sinon.createStubInstance(Logger));
            fs.writeFileSync(filepath, 'module.exports = function () {};');
        });

        afterEach(() => {
            unlinkStub.reset();
        });

        after(() => {
            unlinkStub.restore();
        });

        it('should resolve path to target file', () => {
            const resolvePath = sinon.spy(node, 'resolvePath');

            node.cleanTargetFile(filename);

            expect(resolvePath).to.be.calledWith(filename);
        });

        it('should remove target file if it exists in node dir', () => {
            node.cleanTargetFile(filename);

            expect(unlinkStub).to.be.calledWith(filepath);
        });

        it('should log clean if target file was removed', () => {
            node.cleanTargetFile(filename);

            expect(node.getLogger().logClean).to.be.calledWith(filename);
        });

        it('should not remove file if it does not exist in node dir', () => {
            node.cleanTargetFile('missing_file.js');

            expect(unlinkStub).to.be.not.called;
        });

        it('should not log clean if target file does not exists in node dir', () => {
            node.cleanTargetFile('missing_file.js');

            expect(node.getLogger().logClean).to.be.not.called;
        });
    });

    describe('createTmpFileForTarget', () => {
        it('should return promise', () => {
            const result = node.createTmpFileForTarget('test_target.js');

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should create temp file for target', () => {
            return node.createTmpFileForTarget('test_target.js').then(filename => {
                expect(fs.existsSync(filename)).to.be.true;
            });
        });

        it('should build temp file name as _tmp_%time%%random_string%_%target_name%', () => {
            const regexp = new RegExp('_tmp_\\d{13,14}\\w{6,7}_' + 'test_target\\.js');

            return node.createTmpFileForTarget('test_target.js').then(filename => {
                const relPath = path.relative(nodeFullPath, filename);

                expect(relPath).to.match(regexp);
            });
        });
    });
});
