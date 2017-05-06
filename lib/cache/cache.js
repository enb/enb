/**
 * Cache
 * =====
 */
var inherit = require('inherit'),
    fsUtil = require('../fs/fs-util'),
    _ = require('lodash');

/**
 * Cache — интерфейс для кэширования.
 */
var Cache = inherit({
    /**
     *
     * @param {CacheStorage} storage Хранилище.
     * @param {String} prefix Префикс для данного кэша в рамках хранилища.
     * @constructor
     */
    __constructor: function (storage, prefix) {
        this._storage = storage;
        this._prefix = prefix;
    },

    /**
     * Возвращает данные из кэша по ключу.
     * @param {String} key
     * @returns {Object}
     */
    get: function (key) {
        return this._storage.get(this._prefix, key);
    },

    /**
     * Устанавливает данные в кэше по ключу.
     * @param {String} key
     * @param {Object} value
     */
    set: function (key, value) {
        this._storage.set(this._prefix, key, value);
    },

    /**
     * Возвращает контент закэшированного файла, если он валиден
     * @param {String}  key
     * @param {Number}  sourceMtime время инвалидации закэшированного файла
     *                              если кэш создан до этого времени -> кэш не валиден
     * @param {Object}  opts
     * @param {Boolean} opts.nodePrefix если выставлено в true, то в начало ключа будет
     *                                  добавлен префикс текущей ноды. По-умолчанию true
     * @return {Promise<String|null>}
     */
    getFile: function (key, sourceMtime, opts) {
        key = this._mkFileCacheKey(key, opts);
        return this._storage.fileCache.get(key, sourceMtime);
    },

    /**
     * Возвращает контент закэшированного файла, если он валиден
     * @param {String}  key
     * @param {String}  content
     * @param {Object}  opts
     * @param {Boolean} opts.nodePrefix если выставлено в true, то в начало ключа будет
     *                                  добавлен префикс текущей ноды. По-умолчанию true
     * @return {Promise}
     */
    putFile: function (key, content, opts) {
        key = this._mkFileCacheKey(key, opts);
        return this._storage.fileCache.put(key, content);
    },

    _mkFileCacheKey: function (key, opts) {
        opts = _.defaults(opts || {}, {
            nodePrefix: true
        });

        return opts.nodePrefix ? (this._prefix + '/' + key) : key;
    },

    /**
     * Удаляет данные кэша по ключу.
     * @param {String} key
     */
    invalidate: function (key) {
        this._storage.invalidate(this._prefix, key);
    },

    /**
     * Очищает кэш.
     */
    drop: function () {
        this._storage.dropPrefix(this._prefix);
    },

    /**
     * Возвращает новый интерфейс к хранилищу кэша с дополненным префиксом.
     * @param {String} name
     * @returns {Cache}
     */
    subCache: function (name) {
        return new Cache(this._storage, this._prefix + '/' + name);
    },

    /**
     * Возвращает true, если время изменения для файла изменилиась по данному ключу.
     * В противном случае возвращает false.
     * @param {String} cacheKey
     * @param {String} filename
     * @returns {Boolean}
     */
    needRebuildFile: function (cacheKey, filename) {
        var cachedFile = this.get(cacheKey);
        if (cachedFile) {
            return cachedFile.mtime !== fsUtil.getFileInfo(filename).mtime;
        } else {
            return true;
        }
    },

    /**
     * Кэширует информацию о файле для последующего сравнения.
     * @param {String} cacheKey
     * @param {String} filename
     */
    cacheFileInfo: function (cacheKey, filename) {
        this.set(cacheKey, fsUtil.getFileInfo(filename));
    },

    /**
     * Возвращает true, если время изменения для файлов изменились по данному ключу.
     * В противном случае возвращает false.
     * @param {String} cacheKey
     * @param {Object[]} files
     * @returns {Boolean}
     */
    needRebuildFileList: function (cacheKey, files) {
        var cachedFiles = this.get(cacheKey);
        if (cachedFiles && Array.isArray(cachedFiles)) {
            var l = files.length;
            if (l !== cachedFiles.length) {
                return true;
            }
            for (var i = 0; i < l; i++) {
                var cf = cachedFiles[i],
                    fileInfo = files[i];

                if (cf.mtime !== fileInfo.mtime || cf.fullname !== fileInfo.fullname) {
                    return true;
                }
            }
            return false;
        } else {
            return true;
        }
    },

    /**
     * Кэширует информацию о списке файлов для последующего сравнения.
     * @param {String} cacheKey
     * @param {Object[]} filelist
     */
    cacheFileList: function (cacheKey, filelist) {
        this.set(cacheKey, filelist);
    },

    destruct: function () {
        delete this._storage;
    }
});

module.exports = Cache;
