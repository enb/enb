/**
 * deps-merge
 * ==========
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var deps = require('../lib/deps/deps');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'deps-merge';
    },

    configure: function () {
        var _this = this;
        this._sources = this.getRequiredOption('depsSources').map(function (source) {
            return _this.node.unmaskTargetName(source);
        });
        this._target = this.node.unmaskTargetName(
            this.getOption('depsTarget', this.node.getTargetName('deps.js')));
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var _this = this;
        var depsTarget = this.node.unmaskTargetName(this._target);
        var depsTargetPath = this.node.resolvePath(depsTarget);
        var cache = this.node.getNodeCache(depsTarget);
        var sources = this._sources;
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'merge-deps', 'enb-bem-techs');

        return this.node.requireSources(sources).then(function (depResults) {
            var rebuildNeeded = cache.needRebuildFile('deps-file', depsTargetPath);
                if (!rebuildNeeded) {
                sources.forEach(function (source) {
                    if (cache.needRebuildFile(source, _this.node.resolvePath(source))) {
                        rebuildNeeded = true;
                    }
                });
            }
            if (rebuildNeeded) {
                var mergedDeps = deps.merge(depResults);
                return vowFs.write(
                    depsTargetPath, 'exports.deps = ' + JSON.stringify(mergedDeps) + ';'
                ).then(function () {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    sources.forEach(function (source) {
                        cache.cacheFileInfo(source, _this.node.resolvePath(source));
                    });
                    _this.node.resolveTarget(depsTarget, mergedDeps);
                });
            } else {
                _this.node.isValidTarget(depsTarget);
                dropRequireCache(require, depsTargetPath);
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});
