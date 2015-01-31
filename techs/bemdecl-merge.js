/**
 * bemdecl-merge
 * =============
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var deps = require('../lib/deps/deps');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'bemdecl-merge';
    },

    configure: function () {
        var _this = this;
        this._sources = this.getRequiredOption('bemdeclSources').map(function (source) {
            return _this.node.unmaskTargetName(source);
        });
        this._target = this.node.unmaskTargetName(this.getOption('bemdeclTarget', '?.bemdecl.js'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var bemdeclTarget = this.node.unmaskTargetName(this._target);
        var bemdeclTargetPath = this.node.resolvePath(bemdeclTarget);
        var cache = this.node.getNodeCache(bemdeclTarget);
        var sources = this._sources;
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'merge-bemdecl', 'enb-bem-techs');

        return this.node.requireSources(sources).then(function () {
            var rebuildNeeded = cache.needRebuildFile('bemdecl-file', bemdeclTargetPath);
                if (!rebuildNeeded) {
                sources.forEach(function (source) {
                    if (cache.needRebuildFile(source, _this.node.resolvePath(source))) {
                        rebuildNeeded = true;
                    }
                });
            }
            if (rebuildNeeded) {
                var bemdeclResults = [];
                sources.forEach(function (source) {
                    var sourcePath = _this.node.resolvePath(source);
                    dropRequireCache(require, sourcePath);
                    bemdeclResults.push(require(sourcePath));
                });
                var mergedDeps = deps.merge(bemdeclResults.map(function (bemdecl) {
                    return deps.fromBemdecl(bemdecl);
                }));
                return vowFs.write(
                    bemdeclTargetPath, 'exports.deps = ' + JSON.stringify(mergedDeps) + ';'
                ).then(function () {
                    cache.cacheFileInfo('bemdecl-file', bemdeclTargetPath);
                    sources.forEach(function (source) {
                        cache.cacheFileInfo(source, _this.node.resolvePath(source));
                    });
                    _this.node.resolveTarget(bemdeclTarget, mergedDeps);
                });
            } else {
                _this.node.isValidTarget(bemdeclTarget);
                dropRequireCache(require, bemdeclTargetPath);
                _this.node.resolveTarget(bemdeclTarget, require(bemdeclTargetPath).deps);
                return null;
            }
        });
    }
});
