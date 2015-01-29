/**
 * CacheStorage
 * ============
 */
var fs = require('fs');
var dropRequireCache = require('../fs/drop-require-cache');
var Vow = require('vow');
/**
 * CacheStorage — хранилище для кэша.
 * @name CacheStorage
 * @param {String} filename Имя файла, в котором хранится кэш (в формате JSON).
 * @constructor
 */
function CacheStorage(filename) {
    this._filename = filename;
    this._data = {};
    this._mtime = 0;
}

CacheStorage.prototype = {
    /**
     * Загружает кэш из файла.
     */
    load: function () {
        if (fs.existsSync(this._filename)) {
            dropRequireCache(require, this._filename);
            try {
                this._data = require(this._filename);
            } catch (e) {
                this._data = {};
            }
            this._mtime = fs.statSync(this._filename).mtime.getTime();
        } else {
            this._data = {};
        }
    },

    /**
     * Сохраняет кэш в файл.
     */
    save: function () {
        fs.writeFileSync(this._filename, 'module.exports = ' + JSON.stringify(this._data) + ';', 'utf8');
        this._mtime = fs.statSync(this._filename).mtime.getTime();
    },

    /**
     * Сохраняет кэш в файл асинхронно.
     */
    saveAsync: function () {
        var _this = this;
        var promise = Vow.promise();
        var stream = fs.createWriteStream(this._filename)
            .on('error', function (err) {
                promise.reject(err);
            });

        // Делаем stringify() на каждый объект в кеше чтобы уменьшить потребление памяти -
        // stringify() на больших кешах может отъедать сотни МБ.
        stream.write('module.exports = {');
        Object.keys(this._data).forEach(function (key) {
            stream.write('"' + key + '":' + JSON.stringify(_this._data[key]) + ',');
        });

        stream.end('};', function () {
            _this._mtime = fs.statSync(_this._filename).mtime.getTime();
            promise.fulfill();
        });

        return promise;
    },

    /**
     * Возвращает значение по префику и ключу.
     * @param {String} prefix
     * @param {String} key
     * @returns {Object}
     */
    get: function (prefix, key) {
        return this._data[prefix] && this._data[prefix][key];
    },

    /**
     * Устанавливает значение по префиксу и ключу.
     * @param {String} prefix
     * @param {String} key
     * @param {Object} value
     */
    set: function (prefix, key, value) {
        (this._data[prefix] || (this._data[prefix] = {}))[key] = value;
    },

    /**
     * Удаляет значение по префиксу и ключу.
     * @param {String} prefix
     * @param {String} key
     */
    invalidate: function (prefix, key) {
        var prefixObj = this._data[prefix];
        if (prefixObj) {
            delete prefixObj[key];
        }
    },

    /**
     * Удаляет все значения по префиксу.
     * @param {String} prefix
     */
    dropPrefix: function (prefix) {
        delete this._data[prefix];
    },

    /**
     * Очищает кэш.
     */
    drop: function () {
        this._data = {};
    }
};

module.exports = CacheStorage;
