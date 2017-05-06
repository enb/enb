var vow = require('vow');
var fs = require('fs');
var path = require('path');
var mockFs = require('mock-fs');
var _ = require('lodash');
var CacheStorage = require('../../../lib/cache/cache-storage');
var FileCache = require('../../../lib/cache/file-cache');

describe('cache/cache-storage', function () {
    var sandbox = sinon.sandbox.create();

    afterEach(function () {
        sandbox.restore();
        mockFs.restore();
    });

    describe('constructor', function () {
        beforeEach(function () {
            mockFs({});

            sandbox.spy(fs, 'existsSync');
        });

        it('should save filename', function () {
            var storage = createCacheStorage_({
                tmpDir: '/path/to/',
                filename: 'test_file.json'
            });

            storage.load();

            expect(fs.existsSync).to.be.calledWith(path.normalize('/path/to/test_file.json'));
        });

        it('should create FileCache instance', function () {
            var fileCacheStub = sinon.createStubInstance(FileCache);
            sandbox.stub(FileCache.prototype, '__constructor').returns(fileCacheStub);

            var storage = createCacheStorage_({ tmpDir: '/path/to/tmp' });

            expect(FileCache.prototype.__constructor).to.be.calledWithMatch({ tmpDir: '/path/to/tmp' });
            expect(storage.fileCache).to.be.equal(fileCacheStub);
        });
    });

    describe('load', function () {
        it('should set data as empty object if cache file does not exist', function () {
            mockFs({
                '/path/to': {
                    'test_file.json': ''
                }
            });

            var storage = createCacheStorage_({
                tmpDir: '/path/to/',
                filename: 'test_file.json'
            });

            storage.load();
            storage.save(); // the only way to check internal data contents is to save cache to file

            assertStorageData('/path/to/test_file.json', {});
        });

        it('should load cached data', function () {
            mockFs({
                '/path/to': {
                    'test_file.json': '{ "foo": "bar" }'
                }
            });

            var storage = createCacheStorage_({
                tmpDir: '/path/to/',
                filename: 'test_file.json'
            });

            storage.load();
            storage.save(); // the only way to check internal data contents is to save cache to file

            assertStorageData('/path/to/test_file.json', { foo: 'bar' });
        });

        it('should set data as empty object if exception occured during loading cache file', function () {
            mockFs({
                '/path/to': {
                    'test_file.json': 'throw new Error();'
                }
            });

            var storage = createCacheStorage_({
                tmpDir: '/path/to/',
                filename: 'test_file.json'
            });

            storage.load();
            storage.save();

            assertStorageData('/path/to/test_file.json', {});
        });
    });

    describe('save', function () {
        it('should write data in JSON format', function () {
            mockFs({
                '/path/to': {}
            });

            var storage = createCacheStorage_({
                tmpDir: '/path/to/',
                filename: 'test_file.json'
            });

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.save();

            assertStorageData('/path/to/test_file.json', {
                testPrefix: {
                    testKey: 'test_value'
                }
            });
        });
    });

    describe('saveAsync', function () {
        it('should return promise', function () {
            var storage = createCacheStorage_();
            var result = storage.saveAsync();

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should save data to file asynchronously', function () {
            mockFs({
                '/path/to': {}
            });

            var storage = createCacheStorage_({
                tmpDir: '/path/to/',
                filename: 'test_file.json'
            });

            storage.set('testPrefix', 'testKey', 'test_value');

            return storage.saveAsync().then(function () {
                assertStorageData('/path/to/test_file.json', {
                    testPrefix: {
                        testKey: 'test_value'
                    }
                });
            });
        });

        it('should write data to stream split in chunks by prefix', function () {
            var writeStream = sinon.createStubInstance(fs.WriteStream);
            var storage = createCacheStorage_();

            sandbox.stub(fs, 'createWriteStream');
            fs.createWriteStream.returns(writeStream);
            writeStream.on.returns(writeStream);

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.saveAsync();

            expect(writeStream.write).to.be.calledWith('"testPrefix":');
            expect(writeStream.write).to.be.calledWith(JSON.stringify({
                testKey: 'test_value'
            }));
        });

        it('should reject promise if error ocured during file write', function () {
            mockFs({});

            var storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');

            return expect(storage.saveAsync()).to.be.rejected; // saving to missing dir
        });
    });

    describe('invalidate', function () {
        it('should remove value by key and prefix', function () {
            var storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            expect(storage.get('testPrefix', 'testKey'))
                .to.be.equal('test_value');

            storage.invalidate('testPrefix', 'testKey');
            expect(storage.get('testPrefix', 'testKey'))
                .to.be.undefined;
        });

        it('should not delete another data for this prefix', function () {
            var storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.set('testPrefix', 'another_test_key', 'another_test_value');

            storage.invalidate('testPrefix', 'testKey');
            expect(storage.get('testPrefix', 'another_test_key'))
                .to.be.equal('another_test_value');
        });
    });

    describe('dropPrefix', function () {
        it('should delete all data for provided prefix', function () {
            var storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.set('testPrefix', 'another_test_key', 'test_value');

            storage.dropPrefix('testPrefix');

            expect(storage.get('testPrefix', 'testKey')).to.be.undefined;
            expect(storage.get('testPrefix', 'another_test_key')).to.be.undefined;
        });
    });

    describe('drop', function () {
        it('should clear current cache state', function () {
            var storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.set('another_test_prefix', 'another_test_key', 'test_value');

            storage.drop();

            expect(storage.get('testPrefix', 'testKey')).to.be.undefined;
            expect(storage.get('another_test_prefix', 'another_test_key')).to.be.undefined;
        });

        it('should drop file cache', function () {
            sandbox.stub(FileCache.prototype, 'drop');
            var storage = createCacheStorage_();

            storage.drop();

            expect(FileCache.prototype.drop).to.be.called;
        });
    });

    function createCacheStorage_(opts) {
        opts = _.defaults(opts || {}, {
            tmpDir: '/default/tmp/dir',
            filename: 'default_file.json'
        });

        return new CacheStorage(opts);
    }

    function assertStorageData(dataPath, expected) {
        var data = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));

        expect(data).to.be.deep.equal(expected);
    }
});
