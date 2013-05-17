/**
 * CacheStorage
 * ============
 */
var fs = require('graceful-fs'),
    inherit = require('inherit');

/**
 * CacheStorage — хранилище для кэша.
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
    load: function() {
        if (fs.existsSync(this._filename)) {
            delete require.cache[this._filename];
            this._data = require(this._filename);
            this._mtime = +fs.statSync(this._filename).mtime;
        } else {
            this._data = {};
        }
    },

    /**
     * Сохраняет кэш в файл.
     */
    save: function() {
        fs.writeFileSync(this._filename, 'module.exports = ' + JSON.stringify(this._data) + ';', 'utf8');
        this._mtime = +fs.statSync(this._filename).mtime;
    },

    /**
     * Возвращает значение по префику и ключу.
     * @param {String} prefix
     * @param {String} key
     * @returns {Object}
     */
    get: function(prefix, key) {
        return this._data[prefix] && this._data[prefix][key];
    },

    /**
     * Устанавливает значение по префиксу и ключу.
     * @param {String} prefix
     * @param {String} key
     * @param {Object} value
     */
    set: function(prefix, key, value) {
        (this._data[prefix] || (this._data[prefix] = {}))[key] = value;
    },

    /**
     * Удаляет значение по префиксу и ключу.
     * @param {String} prefix
     * @param {String} key
     */
    invalidate: function(prefix, key) {
        var prefixObj = this._data[prefix];
        if (prefixObj) {
            delete prefixObj[key];
        }
    },

    /**
     * Удаляет все значения по префиксу.
     * @param {String} prefix
     */
    dropPrefix: function(prefix) {
        delete this._data[prefix];
    },

    /**
     * Очищает кэш.
     */
    drop: function() {
        this._data = {};
    }
};

module.exports = CacheStorage;
