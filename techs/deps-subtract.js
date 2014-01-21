/**
 * deps-subtract
 * =============
 *
 * Формирует *deps* с помощью вычитания одного deps-файла из другого.
 * Может применяться в паре с `deps-provider` для получения deps для bembundle.
 *
 * **Опции**
 *
 * * *String* **subtractFromTarget** — Таргет, из которого вычитать. Обязательная опция.
 * * *String* **subtractWhatTarget** — Таргет, который вычитать. Обязательная опция.
 * * *String* **depsTarget** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   [ require('enb/techs/deps'), { depsTarget: 'router.tmp.deps.js' } ],
 *   [ require('enb/techs/deps-provider'), { sourceNodePath: 'pages/index', depsTarget: 'index.deps.js' }],
 *   [ require('enb/techs/deps-subtract'), {
 *     subtractWhatTarget: 'index.deps.js',
 *     subtractFromTarget: 'router.tmp.deps.js',
 *     depsTarget: 'router.deps.js'
 *   } ]
 * ]);
 * ```
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
