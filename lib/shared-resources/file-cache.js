var inherit = require('inherit');
var path = require('path');
var getFileInfo = require('../utils/getFileInfo');
var vow = require('vow');
var vowFs = require('vow-fs');

module.exports = inherit({
    __constructor: function (cacheDir) {
        this._cacheDir = path.resolve(cacheDir || '.enb/tmp/cache');
    },

    destruct: function () {
    },

    _getCachePath: function (cacheKey) {
        // TODO: normalize cacheKey (../.. and so on)
        return path.join(this._cacheDir, cacheKey);
    },

    get: function (cacheKey, sourceMtime) {
        var cachePath = this._getCachePath(cacheKey);
        var info = getFileInfo(cachePath);

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
