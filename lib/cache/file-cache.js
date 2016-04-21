'use strict';

var inherit = require('inherit'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    fsUtil = require('../fs/fs-util');

module.exports = inherit({
    /**
     * @param {Object} opts
     * @param {String} opts.tmpDir directory where file cache work directory will be created
     */
    __constructor: function (opts) {
        this._cacheDir = path.join(opts.tmpDir, 'file-cache');
    },

    /**
     * returns cached file content if it was created after source file was updated
     *
     * @param {String} cacheKey key with wich file was cached
     * @param {Number} sourceMtime source file update time (ms since 1 January 1970 00:00:00 UTC.)
     * @return {Promise<String|null>} will be resolved with cached file content
     *                              or null if cached file is invalid
     */
    get: function (cacheKey, sourceMtime) {
        if (this._mtime) {
            sourceMtime = Math.max(sourceMtime, this._mtime);
        }

        var cachePath = this._getCachePath(cacheKey),
            cacheMtime = fsUtil.getFileInfo(cachePath).mtime;

        return cacheMtime && sourceMtime < cacheMtime
            ? vowFs.read(cachePath)
            : vow.resolve(null);
    },

    /**
     * cache file
     * @param {String} cacheKey
     * @param {String} content
     * @return {Promise}
     */
    put: function (cacheKey, content) {
        return vowFs.makeDir(this._cacheDir)
            .then(function () {
                this.put = this._put; // performance optimization, we need to create cache dir only first time
                return this._put(cacheKey, content);
            }.bind(this));
    },

    _put: function (cacheKey, content) {
        var cachePath = this._getCachePath(cacheKey);
        return vowFs.write(cachePath, content);
    },

    _getCachePath: function (cacheKey) {
        return path.join(this._cacheDir, fsUtil.mkHash(cacheKey));
    },

    /**
     * Invalidate all cached files
     */
    drop: function () {
        this._mtime = Date.now();
    }
});
