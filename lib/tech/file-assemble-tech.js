/**
 * FileAssembleTech
 * ================
 */

var inherit = require('inherit');
var Vow = require('vow');
var vowFs = require('../fs/async-fs');

/**
 * Одна из вариаций хэлпера для упрощения создания технологий.
 * Был заменен на BuildFlow.
 * Более не поддерживается.
 * @name FileAssembleTech
 *
 * @deprecated
 */
var FileAssembleTech = inherit(require('./base-tech'), /** @lends FileAssembleTech.prototype */ {
    init: function () {
        this.__base.apply(this, arguments);
        this._filesTarget = this.node.unmaskTargetName(this.getOption('filesTarget', '?.files'));
    },
    getDestSuffixes: function () {
        throw new Error('You are required to override getDestSuffixes method of FileAssembleTech.');
    },
    getSourceSuffixes: function () {
        throw new Error('You are required to override getSourceSuffixes method of FileAssembleTech.');
    },
    getTargetName: function (suffix) {
        return this.node.getTargetName(suffix);
    },
    getTargets: function () {
        var _this = this;
        return this.getDestSuffixes().map(function (suffix) {
            return _this.getTargetName(suffix);
        });
    },
    isRebuildRequired: function (suffix) {
        var target = this.getTargetName(suffix);
        return this.node.getNodeCache(target).needRebuildFile('file', this.node.resolvePath(target));
    },
    cacheSuffixInfo: function (suffix) {
        var target = this.getTargetName(suffix);
        this.node.getNodeCache(target).cacheFileInfo('file', this.node.resolvePath(target));
    },
    buildResultCached: function (sourceFiles, suffix) {
        var target = this.getTargetName(suffix);
        var cache = this.node.getNodeCache(target);
        var _this = this;
        if (this.isRebuildRequired(suffix) || cache.needRebuildFileList('file-list', sourceFiles)) {
            return Vow.when(this.buildResult(sourceFiles, suffix))
                .then(function () {
                    _this.cacheSuffixInfo(suffix);
                    cache.cacheFileList('file-list', sourceFiles);
                    _this.node.resolveTarget(target);
                });
        } else {
            _this.node.isValidTarget(target);
            _this.node.resolveTarget(target);
            return Vow.fulfill();
        }
    },
    buildResult: function (sourceFiles, suffix) {
        var _this = this;
        try {
            return Vow.when(this.getBuildResult(sourceFiles, suffix))
                .then(function (content) {
                    return vowFs.write(_this.node.resolvePath(_this.getTargetName(suffix)), content, 'utf8');
                });
        } catch (err) {
            return Vow.reject(err);
        }
    },
    getBuildResult: function () {
        throw new Error('You are required to override getBuildResult method of FileAssembleTech.');
    },
    buildResults: function (sourceFiles, suffixes) {
        var _this = this;
        return Vow.all(suffixes.map(function (suffix) {
            return _this.buildResultCached(sourceFiles, suffix);
        }));
    },
    writeFile: function (filename, content) {
        return vowFs.write(filename, content, 'utf8');
    },
    filterSourceFiles: function (files) {
        return files;
    },
    build: function () {
        var _this = this;
        return this.node.requireSources([this._filesTarget]).spread(function (files) {
            var sourceSuffixes = _this.getSourceSuffixes() || [];
            var sourceFiles = sourceSuffixes.length ? files.getBySuffix(sourceSuffixes) : [];
            sourceFiles = _this.filterSourceFiles(sourceFiles);
            return Vow.when(_this.getDestSuffixes()).then(function (suffixes) {
                return _this.buildResults(sourceFiles, suffixes);
            });
        });
    }
});

module.exports = FileAssembleTech;
