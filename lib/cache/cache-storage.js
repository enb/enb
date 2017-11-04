'use strict';

/**
 * CacheStorage
 * ============
 */
var fs = require('fs');
var vow = require('vow');
var inherit = require('inherit');

/**
 * CacheStorage — хранилище для кэша.
 * @name CacheStorage
 */
var CacheStorage = inherit(/** @lends CacheStorage.prototype */ {
    /**
     *
     * @name CacheStorage
     * @param {String} filename Имя файла, в котором хранится кэш (в формате JSON).
     * @constructor
     */
    __constructor(filename) {
        this._filename = filename;
        this._data = {};
        this._mtime = 0;
    },

    /**
     * Загружает кэш из файла.
     */
    load() {
        if (fs.existsSync(this._filename)) {
            try {
                this._data = JSON.parse(fs.readFileSync(this._filename, 'utf8'));
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
    save() {
        fs.writeFileSync(this._filename, JSON.stringify(this._data), 'utf8');
        this._mtime = fs.statSync(this._filename).mtime.getTime();
    },

    /**
     * Сохраняет кэш в файл асинхронно.
     * @returns {Promise}
     */
    saveAsync() {
        var _this = this;

        return new vow.Promise(function (resolve, reject) {
            var prefixes = Object.keys(_this._data);
            var stream = fs.createWriteStream(_this._filename)
                .on('error', function (err) {
                    return reject(err);
                });

            // Делаем stringify() на каждый объект в кеше чтобы уменьшить потребление памяти -
            // stringify() на больших кешах может отъедать сотни МБ.
            stream.write('{');

            prefixes.forEach(function (prefix, idx) {
                stream.write('"' + prefix + '":');
                stream.write(JSON.stringify(_this._data[prefix]));
                if (idx < prefixes.length - 1) {
                    stream.write(',');
                }
            });

            stream.end('}', function () {
                _this._mtime = fs.statSync(_this._filename).mtime.getTime();
                return resolve();
            });
        });
    },

    /**
     * Возвращает значение по префику и ключу.
     * @param {String} prefix
     * @param {String} key
     * @returns {Object}
     */
    get(prefix, key) {
        return this._data[prefix] && this._data[prefix][key];
    },

    /**
     * Устанавливает значение по префиксу и ключу.
     * @param {String} prefix
     * @param {String} key
     * @param {Object} value
     */
    set(prefix, key, value) {
        (this._data[prefix] || (this._data[prefix] = {}))[key] = value;
    },

    /**
     * Удаляет значение по префиксу и ключу.
     * @param {String} prefix
     * @param {String} key
     */
    invalidate(prefix, key) {
        var prefixObj = this._data[prefix];
        if (prefixObj) {
            delete prefixObj[key];
        }
    },

    /**
     * Удаляет все значения по префиксу.
     * @param {String} prefix
     */
    dropPrefix(prefix) {
        delete this._data[prefix];
    },

    /**
     * Очищает кэш.
     */
    drop() {
        this._data = {};
    }
});

module.exports = CacheStorage;
