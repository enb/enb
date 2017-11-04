'use strict'

const vow = require('vow');
const fs = require('fs');
const path = require('path');
const mockFs = require('mock-fs');
const CacheStorage = require('../../../lib/cache/cache-storage');

describe('cache/cache-storage', function () {
    const sandbox = sinon.sandbox.create();

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
            const storage = createCacheStorage_('/path/to/test_file.json');

            storage.load();

            expect(fs.existsSync).to.be.calledWith('/path/to/test_file.json');
        });
    });

    describe('load', function () {
        it('should set data as empty object if cache file does not exist', function () {
            mockFs({
                '/path/to': {
                    'test_file.json': ''
                }
            });

            const storage = createCacheStorage_('/path/to/test_file.json');

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

            const storage = createCacheStorage_('/path/to/test_file.json');

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

            const storage = createCacheStorage_('/path/to/test_file.json');

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

            const storage = createCacheStorage_('/path/to/test_file.json');

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
            const storage = createCacheStorage_();
            const result = storage.saveAsync();

            expect(result).to.be.instanceOf(vow.Promise);
        });

        it('should save data to file asynchronously', function () {
            mockFs({
                '/path/to': {}
            });

            const storage = createCacheStorage_('/path/to/test_file.json');

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
            const writeStream = sinon.createStubInstance(fs.WriteStream);
            const storage = createCacheStorage_('/path/to/test_file.json');

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

            const storage = createCacheStorage_('/path/to/test_file.json');

            storage.set('testPrefix', 'testKey', 'test_value');

            return expect(storage.saveAsync()).to.be.rejected; // saving to missing dir
        });
    });

    describe('invalidate', function () {
        it('should remove value by key and prefix', function () {
            const storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            expect(storage.get('testPrefix', 'testKey'))
                .to.be.equal('test_value');

            storage.invalidate('testPrefix', 'testKey');
            expect(storage.get('testPrefix', 'testKey'))
                .to.be.undefined;
        });

        it('should not delete another data for this prefix', function () {
            const storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.set('testPrefix', 'another_test_key', 'another_test_value');

            storage.invalidate('testPrefix', 'testKey');
            expect(storage.get('testPrefix', 'another_test_key'))
                .to.be.equal('another_test_value');
        });
    });

    describe('dropPrefix', function () {
        it('should delete all data for provided prefix', function () {
            const storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.set('testPrefix', 'another_test_key', 'test_value');

            storage.dropPrefix('testPrefix');

            expect(storage.get('testPrefix', 'testKey')).to.be.undefined;
            expect(storage.get('testPrefix', 'another_test_key')).to.be.undefined;
        });
    });

    describe('drop', function () {
        it('should clear current cache state', function () {
            const storage = createCacheStorage_();

            storage.set('testPrefix', 'testKey', 'test_value');
            storage.set('another_test_prefix', 'another_test_key', 'test_value');

            storage.drop();

            expect(storage.get('testPrefix', 'testKey')).to.be.undefined;
            expect(storage.get('another_test_prefix', 'another_test_key')).to.be.undefined;
        });
    });

    function createCacheStorage_(filename) {
        return new CacheStorage(filename || '/path/to/default_file.json');
    }

    function assertStorageData(dataPath, expected) {
        const data = JSON.parse(fs.readFileSync(path.resolve(dataPath), 'utf8'));

        expect(data).to.be.deep.equal(expected);
    }
});
