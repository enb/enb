/**
 * bemdecl-provider
 * ================
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'bemdecl-provider';
    },

    configure: function () {
        this._sourceNodePath = this.getRequiredOption('sourceNodePath');
        this._sourceTarget = this.getOption('sourceTarget', '?.bemdecl.js');
        this._target = this.node.unmaskTargetName(this.getOption('bemdeclTarget', '?.bemdecl.js'));
    },

    getTargets: function () {
        return [this._target];
    },

    build: function () {
        var _this = this;
        var bemdeclTarget = this._target;
        var bemdeclTargetPath = this.node.resolvePath(bemdeclTarget);
        var fromNode = this._sourceNodePath;
        var cache = this.node.getNodeCache(bemdeclTarget);
        var requirements = {};
        var sourceTargetName = this.node.unmaskNodeTargetName(fromNode, this._sourceTarget);
        var sourceTargetPath = this.node.resolveNodePath(fromNode, sourceTargetName);
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'provide-bemdecl', 'enb-bem-techs');

        requirements[fromNode] = [sourceTargetName];
        return this.node.requireNodeSources(requirements).then(function (results) {
            var deps = results[fromNode][0];
            if (cache.needRebuildFile('bemdecl-file', bemdeclTargetPath) ||
                cache.needRebuildFile('bemdecl-source-file', sourceTargetPath)
            ) {
                return vowFs.read(sourceTargetPath, 'utf8').then(function (data) {
                    vowFs.write(bemdeclTargetPath, data).then(function () {
                        cache.cacheFileInfo('bemdecl-file', bemdeclTargetPath);
                        cache.cacheFileInfo('bemdecl-source-file', sourceTargetPath);
                        _this.node.resolveTarget(bemdeclTarget, deps);
                    });
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
