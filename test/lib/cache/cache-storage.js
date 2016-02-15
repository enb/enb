var vow = require('vow');
var fs = require('fs');
var path = require('path');
var mockFs = require('mock-fs');
var mock = require('mock-require');
var clearRequire = require('clear-require');
var CacheStorage = require('../../../lib/cache/cache-storage');

describe('cache/cache-storage', function () {
    var sandbox = sinon.sandbox.create();

    afterEach(function () {
        sandbox.restore();
        mockFs.restore();
        mock.stop('/path/to/test_file.js');
    });

    describe('constructor', function () {
        beforeEach(function () {
            sandbox.stub(fs);
        });

        it('should save filename', function () {
            var storage = createCacheStorage_('/path/to/test_file.js');

            storage.load();

            expect(fs.existsSync).to.be.calledWith('/path/to/test_file.js');
        });
    });

    describe('load', function () {
        it('should set data as empty object if cache file does not exist', function () {
            mockFs({
                '/path/to': {
                    'test_file.js': ''
                }
            });

            mock('/path/to/test_file.js', {});

            var storage = createCacheStorage_('/path/to/test_file.js');

            storage.load();
            storage.save(); // the only way to check internal data contents is to save cache to file

            assertStorageData('/path/to/test_file.js', {});
        });

        it('should clear require for cache file', function () {
            mockFs({
                '/path/to': {
                    'test_file.js': 'module.exports = {};'
                }
            });
            var storage = createCacheStorage_('/path/to/test_file.js');

            mock('/path/to/test_file.js', { cache: { '/path/to/test_file.js': 'foo' } });

            storage.load();

            expect(require.cache[path.resolve('/path/to/test_file.js')])
                .to.be.not.equal('foo');
        });

        it('should load cached data', function () {
            mockFs({
                '/path/to': {
                    'test_file.js': 'module.exports = { foo: "bar" };'
                }
            });

            mock('/path/to/test_file.js', { foo: 'bar' });

            var storage = createCacheStorage_('/path/to/test_file.js');

            storage.load();
            storage.save(); // the only way to check internal data contents is to save cache to file

            assertStorageData('/path/to/test_file.js', { foo: 'bar' });
        });

        it('should set data as empty object if exception occured during loading cache file', function () {
            mockFs({
                '/path/to': {
                    'test_file.js': 'throw new Error();'
                }
            });

            mock('/path/to/test_file.js', {});

            var storage = createCacheStorage_('/path/to/test_file.js');

            storage.load();
            storage.save();

            assertStorageData('/path/to/test_file.js', {});
        });
    });

    describe('save', function () {
        it('should write data prepending it with module.exports = ', function () {
            mockFs({
                '/path/to': {}
            });

            mock('/path/to/test_file.js', {
                testPrefix: {
                    testKey: 'test_value'
                }
            });

            var storage = createCacheStorage_('/path/to/test_file.js');

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.save();

            assertStorageData('/path/to/test_file.js', {
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

            var storage = createCacheStorage_('/path/to/test_file.js');

            storage.set('testPrefix', 'testKey', 'test_value');

            mock('/path/to/test_file.js', {
                testPrefix: {
                    testKey: 'test_value'
                }
            });

            return storage.saveAsync().then(function () {
                assertStorageData('/path/to/test_file.js', {
                    testPrefix: {
                        testKey: 'test_value'
                    }
                });
            });
        });

        it('should write data to stream split in chunks by prefix', function () {
            var writeStream = sinon.createStubInstance(fs.WriteStream);
            var storage = createCacheStorage_('/path/to/test_file.js');

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

            var storage = createCacheStorage_('/path/to/test_file.js');

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
    });

    function createCacheStorage_(filename) {
        return new CacheStorage(filename || '/path/to/default_file.js');
    }

    function assertStorageData(dataPath, expected) {
        clearRequire(path.resolve(dataPath)); // in test because it throws on non-existing file

        expect(require(dataPath)).to.be.deep.equal(expected);
    }
});
