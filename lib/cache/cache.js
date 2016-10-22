/**
 * Cache
 * =====
 */
var fs = require('fs'),
    path = require('path'),
    inherit = require('inherit');

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
    __constructor: function (storage, fileCache, prefix) {
        this._storage = storage;
        this._fileCache = fileCache;
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
     * Возвращает контент закэшированного файла, если он валиден.
     *
     * @param {String} sourceFilename Путь к исходному файлу.
     * @param {Object} data           Дополнительная информация.
     * @param {Object} data.mtime     Время последнего изменения исходного файла.
     *                                Если кэш создан до этого времени, то кэш не валиден.
     *
     * @return {Promise<String|null>}
     */
    getFile: function (sourceFilename, data) {
        var cacheDate = data || {};

        cacheDate.__prefix__ = this._prefix;

        return this._fileCache.get(sourceFilename, cacheDate);
    },

    /**
     * Положить результат обработки исходного файла в файловый кэш.
     *
     * @param {String} sourceFilename Путь к исходному файлу.
     * @param {String} contents       Результат обработки исходного файла.
     * @param {Object} data           Дополнительная информация.
     * @param {Object} data.mtime     Время последнего изменения исходного файла.
     *
     * @returns {Promise}
     */
    putFile: function (sourceFilename, contents, data) {
        var cacheDate = data || {};

        cacheDate.__prefix__ = this._prefix;

        return this._fileCache.put(sourceFilename, contents, cacheDate);
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
        return new Cache(this._storage, this._fileCache, this._prefix + '/' + name);
    },

    /**
     * Возвращает информацию о файле по полному пути.
     * @param {String} fullname
     * @returns {{name: *, fullname: *, suffix: string, mtime: null}}
     * @private
     */
    _getFileInfo: function (fullname) {
        var filename = path.basename(fullname),
            mtime = null;

        if (fs.existsSync(fullname)) {
            mtime = fs.statSync(fullname).mtime.getTime();
        }

        return {
            name: filename,
            fullname: fullname,
            suffix: filename.split('.').slice(1).join('.'),
            mtime: mtime
        };
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
            return cachedFile.mtime !== this._getFileInfo(filename).mtime;
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
        this.set(cacheKey, this._getFileInfo(filename));
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
        delete this._fileCache;
    }
});

module.exports = Cache;
