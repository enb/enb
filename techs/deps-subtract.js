/**
 * deps-subtract
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
        return 'deps-subtract';
    },

    configure: function () {
        this._subtractWhatTarget = this.getRequiredOption('subtractWhatTarget');
        this._subtractFromTarget = this.getRequiredOption('subtractFromTarget');
        this._target = this.node.unmaskTargetName(this.getOption('depsTarget', '?.deps.js'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var depsTarget = this.node.unmaskTargetName(this._target);
        var depsTargetPath = this.node.resolvePath(depsTarget);
        var cache = this.node.getNodeCache(depsTarget);
        var substractFromTargetPath = this.node.resolvePath(this._subtractFromTarget);
        var subtractWhatTargetPath = this.node.resolvePath(this._subtractWhatTarget);
        var sourceTargets = [this._subtractFromTarget, this._subtractWhatTarget];
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'subtract-deps', 'enb-bem-techs');

        return this.node.requireSources(sourceTargets).spread(function (subtractFrom, subtractWhat) {
            if (cache.needRebuildFile('deps-file', depsTargetPath) ||
                cache.needRebuildFile('deps-from-file', substractFromTargetPath) ||
                cache.needRebuildFile('deps-what-file', subtractWhatTargetPath)
            ) {
                var subtractedDeps = deps.subtract(subtractFrom, subtractWhat);
                return vowFs.write(
                    depsTargetPath, 'exports.deps = ' + JSON.stringify(subtractedDeps, null, 4) + ';'
                ).then(function () {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    cache.cacheFileInfo('deps-from-file', substractFromTargetPath);
                    cache.cacheFileInfo('deps-what-file', subtractWhatTargetPath);
                    _this.node.resolveTarget(depsTarget, subtractedDeps);
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
