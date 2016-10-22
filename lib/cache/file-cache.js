var assert = require('assert');
var path = require('path');
var crypto = require('crypto');

var inherit = require('inherit');
var vfs = require('vow-fs');

module.exports = inherit({
    /**
     * @param {Object} [options]
     * @param {Object} [options.root]   Корень проекта.
     * @param {Object} [options.tmpDir] Директория для временных файлов ENB.
     */
    __constructor: function (options) {
        var opts = options || {};

        assert(opts.root, 'Project directory required to correctly interpret source file path.');
        assert(opts.tmpDir, 'Temp directory required to write processed files in cache.');

        this._root = opts.root;
        this._cacheDir = path.join(opts.tmpDir, 'file-cache');
        this._mtime = null;
    },

    /**
     * Подготавливает файловый кэш.
     *
     * Во время подготовки создаётся директория для временных файлов.
     *
     * @returns {Promise}
     */
    init: function () {
        return vfs.makeDir(this._cacheDir);
    },

    /**
     * Строит уникальный ключ для файла, результат обработки которого нужно закэшировать.
     *
     * @param {String} sourceFilename Путь к исходному файлу.
     * @param {Object} data           Дополнительная информация.
     *
     * @returns {String}
     */
    _buildKey: function (sourceFilename, data) {
        return sourceFilename + ':' + JSON.stringify(data);
    },

    /**
     * Возвращает путь к временному файлу, расположенного в файловом кэше.
     *
     * @param {String} sourceFilename Путь к исходному файлу.
     * @param {Object} data           Дополнительная информация.
     *
     * @returns {String}
     */
    _getPath: function (sourceFilename, data) {
        var relPath = path.relative(this._root, path.resolve(sourceFilename));
        var cacheKey = this._buildKey(relPath, data);
        var hash = crypto.createHash('md5').update(cacheKey).digest('hex');

        return path.join(this._cacheDir, hash);
    },

    /**
     * Возвращает контент закэшированного файла, если он валиден.
     *
     * @param {String} sourceFilename Путь к исходному файлу.
     * @param {Object} data           Дополнительная информация.
     * @param {Object} data.mtime     Время последнего изменения исходного файла.
     *                                Если кэш создан до этого времени, то кэш не валиден.
     *
     * @returns {Promise<String|null>}
     */
    get: function (sourceFilename, data) {
        var sourceData = data || {};
        var sourceFileMtime = sourceData.mtime;

        assert(sourceFileMtime, 'Time when source file last modified required to correct cache invalidation.');

        if (this._mtime) {
            sourceFileMtime = Math.max(sourceFileMtime, this._mtime);
        }

        var cachedFilename = this._getPath(sourceFilename, sourceData);

        return vfs.stat(cachedFilename)
            .then(function (stats) {
                var cachedFileMtime = stats.mtime;

                if (sourceFileMtime < cachedFileMtime) {
                    return vfs.read(cachedFilename, { encoding: 'utf8' });
                }

                return null;
            })
            .fail(function (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }

                return null;
            });
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
    put: function (sourceFilename, contents, data) {
        var cachedFilename = this._getPath(sourceFilename, data);

        return vfs.write(cachedFilename, contents);
    },

    /**
     * Инвалидирует файловый кэш.
     */
    drop: function () {
        this._mtime = Date.now();
    }
});
