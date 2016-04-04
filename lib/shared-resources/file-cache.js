/**
 * FileCache
 */

var inherit = require('inherit'),
    path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    getFileInfo = require('../utils/getFileInfo');

module.exports = inherit({
    __constructor: function (tmpDir) {
        this._cacheDir = path.join(tmpDir, 'file-cache');
    },

    _getCachePath: function (cacheKey) {
        // TODO: replace : to / in windows paths like D:\something
        if (cacheKey.indexOf('..') !== -1) {
            throw new Error('cacheKey must be a normalized file path, without ..');
        }
        return path.join(this._cacheDir, cacheKey);
    },

    get: function (cacheKey, sourceMtime) {
        var cachePath = this._getCachePath(cacheKey),
            info = getFileInfo(cachePath);

        if (sourceMtime > info.mtime) {
            return vow.resolve(null);
        }

        return vowFs.read(cachePath);
    },

    put: function (cacheKey, content) {
        var cachePath = this._getCachePath(cacheKey);
        return vowFs.makeDir(path.dirname(cachePath))
            .then(function () {
                return vowFs.write(cachePath, content);
            });
    }
});
