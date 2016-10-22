'use strict';

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var mockFs = require('mock-fs');

var FileCache = require('../../../lib/cache/file-cache');

describe('cache/file-cache', function () {
    var projectRoot = 'project';
    var tmpDir = path.join(projectRoot, '.enb', 'tmp');
    var fileCache;

    beforeEach(function () {
        mockFs({
            '.enb': {
                tmp: {}
            }
        });

        fileCache = new FileCache({ tmpDir: tmpDir, root: projectRoot });
    });

    afterEach(function () {
        mockFs.restore();
    });

    describe('init', function () {
        it('should demand root directory', function () {
            expect(function () { new FileCache(); })
                .throws('Project directory required to correctly interpret source file path.');
        });

        it('should demand tmp directory', function () {
            expect(function () { new FileCache({ root: projectRoot }); })
                .throws('Temp directory required to write processed files in cache.');
        });

        it('should create tmp dir', function () {
            mockFs({});

            return fileCache.init().then(function () {
                var access = fs.accessSync(tmpDir);

                expect(access).to.be;
            });
        });

        it('should create cache dir', function () {
            return fileCache.init().then(function () {
                var files = fs.readdirSync(tmpDir);

                expect(files).to.be.deep.equal(['file-cache']);
            });
        });
    });

    describe('_getPath', function () {
        var cryptoStub;
        var buildKeyStub;

        beforeEach(function () {
            cryptoStub = sinon.stub(crypto, 'createHash').returns({
                update: sinon.stub().returns({
                    digest: sinon.stub().returns('hash')
                })
            });
            buildKeyStub = sinon.stub(fileCache, '_buildKey').returns('key');
        });

        afterEach(function () {
            cryptoStub.restore();
            buildKeyStub.restore();
        });

        it('should transform path from root directory', function () {
            var filename = path.join(projectRoot, 'file.js');
            var cacheData = {};

            fileCache._getPath(filename, cacheData);

            expect(buildKeyStub).to.be.calledWith('file.js', cacheData);
        });

        it('should build path in temp directory', function () {
            var filename = path.join(projectRoot, 'file.js');
            var cacheData = {};

            var cachedFilePath = fileCache._getPath(filename, cacheData);

            expect(cachedFilePath).to.equal(path.join(tmpDir, 'file-cache', 'hash'));
        });
    });

    describe('get', function () {
        var getCachedPathStub;

        beforeEach(function () {
            getCachedPathStub = sinon.stub(fileCache, '_getPath').returns('file.js');
        });

        afterEach(function () {
            getCachedPathStub.restore();
        });

        it('should return null if no cached file', function () {
            return expect(function () { fileCache.get('file.js'); })
                .throws('Time when source file last modified required to correct cache invalidation.');
        });

        it('should return null if no cached file', function () {
            var cacheData = { mtime: new Date(1) };

            return fileCache.get('non-exists.file', cacheData).should.become(null);
        });

        it('should return null if cached file outdated', function () {
            mockFs({
                'file.js': mockFs.file({
                    mtime: new Date(1)
                })
            });

            var cacheData = { mtime: new Date(2) };

            return fileCache.get('file.js', cacheData).should.become(null);
        });

        it('should return content if cached file valid', function () {
            mockFs({
                'file.js': mockFs.file({
                    content: 'contents',
                    mtime: new Date(10)
                })
            });

            var cacheData = { mtime: new Date(1) };

            return fileCache.get('file.js', cacheData).should.become('contents');
        });

        it('should return content if cached file valid', function () {
            mockFs({
                'file.js': mockFs.file({
                    content: 'contents',
                    mtime: new Date(10)
                })
            });

            var cacheData = { mtime: new Date(1) };

            return fileCache.get('file.js', cacheData).should.become('contents');
        });
    });

    describe('drop', function () {
        var LAUNCH_TIME = new Date(100);
        var dateNowStub;
        var getCachedPathStub;

        beforeEach(function () {
            getCachedPathStub = sinon.stub(fileCache, '_getPath').returns('file.js');
            dateNowStub = sinon.stub(Date, 'now').returns(LAUNCH_TIME);

            fileCache.drop();
        });

        afterEach(function () {
            dateNowStub.restore();
            getCachedPathStub.restore();
        });

        it('should return null even if cached file valid', function () {
            mockFs({
                'file.js': mockFs.file({
                    content: 'contents',
                    mtime: new Date(10)
                })
            });

            var cacheData = { mtime: LAUNCH_TIME - 1 };

            return fileCache.get('file.js', cacheData).should.become(null);
        });

        it('should read file if file was cached during current launch', function () {
            mockFs({
                'file.js': mockFs.file({
                    content: 'contents',
                    mtime: new Date(10)
                })
            });

            var cacheData = { mtime: LAUNCH_TIME + 1 };

            return fileCache.get('file.js', cacheData).should.become(null);
        });
    });

    describe('put', function () {
        var getCachedPathStub;

        beforeEach(function () {
            getCachedPathStub = sinon.stub(fileCache, '_getPath').returns('hash.js');

            fileCache.drop();
        });

        afterEach(function () {
            getCachedPathStub.restore();
        });

        it('should write file', function () {
            var cacheData = {};

            return fileCache.put('file.js', cacheData).then(function () {
                var stats = fs.statSync('hash.js');

                expect(stats).should.be;
            });
        });

        it('should write file even if cache not used', function () {
            var cacheData = {};

            fileCache.drop();

            return fileCache.put('file.js', cacheData).then(function () {
                var stats = fs.statSync('hash.js');

                expect(stats).should.be;
            });
        });
    });
});
