/**
 * deps-provider
 * =============
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'deps-provider';
    },

    configure: function () {
        this._sourceNodePath = this.getRequiredOption('sourceNodePath');
        this._sourceTarget = this.getOption('sourceTarget', '?.deps.js');
        this._target = this.node.unmaskTargetName(this.getOption('depsTarget', '?.deps.js'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var depsTarget = this._target;
        var depsTargetPath = this.node.resolvePath(depsTarget);
        var fromNode = this._sourceNodePath;
        var sourceTargetName = this.node.unmaskNodeTargetName(fromNode, this._sourceTarget);
        var sourceTargetPath = this.node.resolveNodePath(fromNode, sourceTargetName);
        var cache = this.node.getNodeCache(depsTarget);
        var requirements = {};
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'provide-deps', 'enb-bem-techs');

        requirements[fromNode] = [sourceTargetName];
        return this.node.requireNodeSources(requirements).then(function (results) {
            var deps = results[fromNode][0];
            if (cache.needRebuildFile('deps-file', depsTargetPath) ||
                cache.needRebuildFile('source-deps-file', sourceTargetPath)
            ) {
                return vowFs.write(
                    depsTargetPath, 'exports.deps = ' + JSON.stringify(deps, null, 4) + ';'
                ).then(function () {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    cache.cacheFileInfo('source-deps-file', sourceTargetPath);
                    _this.node.resolveTarget(depsTarget, deps);
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
