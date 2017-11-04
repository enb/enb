'use strict';

const fs = require('fs');
const path = require('path');

const inherit = require('inherit');

/**
 * Cache — интерфейс для кэширования.
 */
const Cache = inherit({
    /**
     *
     * @param {CacheStorage} storage Хранилище.
     * @param {String} prefix Префикс для данного кэша в рамках хранилища.
     * @constructor
     */
    __constructor(storage, prefix) {
        this._storage = storage;
        this._prefix = prefix;
    },

    /**
     * Возвращает данные из кэша по ключу.
     * @param {String} key
     * @returns {Object}
     */
    get(key) {
        return this._storage.get(this._prefix, key);
    },

    /**
     * Устанавливает данные в кэше по ключу.
     * @param {String} key
     * @param {Object} value
     */
    set(key, value) {
        this._storage.set(this._prefix, key, value);
    },

    /**
     * Удаляет данные кэша по ключу.
     * @param {String} key
     */
    invalidate(key) {
        this._storage.invalidate(this._prefix, key);
    },

    /**
     * Очищает кэш.
     */
    drop() {
        this._storage.dropPrefix(this._prefix);
    },

    /**
     * Возвращает новый интерфейс к хранилищу кэша с дополненным префиксом.
     * @param {String} name
     * @returns {Cache}
     */
    subCache(name) {
        return new Cache(this._storage, `${this._prefix}/${name}`);
    },

    /**
     * Возвращает информацию о файле по полному пути.
     * @param {String} fullname
     * @returns {{name: *, fullname: *, suffix: string, mtime: null}}
     * @private
     */
    _getFileInfo(fullname) {
        const filename = path.basename(fullname);
        let mtime = null;

        if (fs.existsSync(fullname)) {
            mtime = fs.statSync(fullname).mtime.getTime();
        }

        return {
            name: filename,
            fullname,
            suffix: filename.split('.').slice(1).join('.'),
            mtime
        };
    },

    /**
     * Возвращает true, если время изменения для файла изменилиась по данному ключу.
     * В противном случае возвращает false.
     * @param {String} cacheKey
     * @param {String} filename
     * @returns {Boolean}
     */
    needRebuildFile(cacheKey, filename) {
        const cachedFile = this.get(cacheKey);
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
    cacheFileInfo(cacheKey, filename) {
        this.set(cacheKey, this._getFileInfo(filename));
    },

    /**
     * Возвращает true, если время изменения для файлов изменились по данному ключу.
     * В противном случае возвращает false.
     * @param {String} cacheKey
     * @param {Object[]} files
     * @returns {Boolean}
     */
    needRebuildFileList(cacheKey, files) {
        const cachedFiles = this.get(cacheKey);
        if (cachedFiles && Array.isArray(cachedFiles)) {
            const l = files.length;
            if (l !== cachedFiles.length) {
                return true;
            }
            for (let i = 0; i < l; i++) {
                const cf = cachedFiles[i];
                const fileInfo = files[i];

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
    cacheFileList(cacheKey, filelist) {
        this.set(cacheKey, filelist);
    },

    destruct() {
        delete this._storage;
    }
});

module.exports = Cache;
