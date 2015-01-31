/**
 * deps-old
 * ========
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var deps = require('../lib/deps/deps');
var OldDeps = require('../exlib/deps').OldDeps;
var asyncRequire = require('../lib/fs/async-require');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function () {
        return 'deps-old';
    },

    configure: function () {
        this._target = this.node.unmaskTargetName(
            this.getOption('depsTarget', this.node.getTargetName('deps.js')));
        this._bemdeclTarget = this.node.unmaskTargetName(
            this.getOption('bemdeclTarget', this.node.getTargetName('bemdecl.js')));
        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));
    },

    getTargets: function () {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function () {
        var _this = this;
        var depsTarget = this._target;
        var depsTargetPath = this.node.resolvePath(depsTarget);
        var cache = this.node.getNodeCache(depsTarget);
        var bemdeclSource = this._bemdeclTarget;
        var bemdeclSourcePath = this.node.resolvePath(bemdeclSource);
        var logger = this.node.getLogger();

        logger.logTechIsDeprecated(this._target, this.getName(),
            'enb', 'deps-old', 'enb-bem-techs');

        return this.node.requireSources([this._levelsTarget, bemdeclSource]).spread(function (levels) {
            var depFiles = levels.getFilesBySuffix('deps.js');
            if (cache.needRebuildFile('deps-file', depsTargetPath) ||
                cache.needRebuildFile('bemdecl-file', bemdeclSourcePath) ||
                cache.needRebuildFileList('deps-file-list', depFiles)
            ) {
                dropRequireCache(require, bemdeclSourcePath);
                return asyncRequire(bemdeclSourcePath).then(function (bemdecl) {
                    return (new OldDeps(deps.toBemdecl(bemdecl)).expandByFS({
                        levels: levels
                    }).then(function (resolvedDeps) {
                        resolvedDeps = resolvedDeps.getDeps();
                        return vowFs.write(
                            depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';\n', 'utf8'
                        ).then(function () {
                            cache.cacheFileInfo('deps-file', depsTargetPath);
                            cache.cacheFileInfo('bemdecl-file', bemdeclSourcePath);
                            cache.cacheFileList('deps-file-list', depFiles);
                            _this.node.resolveTarget(depsTarget, resolvedDeps);
                        });
                    }));
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
