/**
 * deps-subtract
 * =============
 *
 * Формирует *deps* с помощью вычитания одного deps-файла из другого. Может применяться в паре с `deps-provider` для получения deps для bembundle.
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
var Vow = require('vow'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps-subtract';
    },

    configure: function() {
        this._subtractWhatTarget = this.getRequiredOption('subtractWhatTarget');
        this._subtractFromTarget = this.getRequiredOption('subtractFromTarget');
        this._target = this.node.unmaskTargetName(this.getOption('depsTarget', '?.deps.js'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            depsTarget = this.node.unmaskTargetName(this._target),
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            substractFromTargetPath = this.node.resolvePath(this._subtractFromTarget),
            subtractWhatTargetPath = this.node.resolvePath(this._subtractWhatTarget),
            sourceTargets = [this._subtractFromTarget, this._subtractWhatTarget];
        return this.node.requireSources(sourceTargets).spread(function(subtractFrom, subtractWhat) {
            if (cache.needRebuildFile('deps-file', depsTargetPath)
                || cache.needRebuildFile('deps-from-file', substractFromTargetPath)
                || cache.needRebuildFile('deps-what-file', subtractWhatTargetPath)
            ) {
                var subtractedDeps = deps.subtract(subtractFrom, subtractWhat);
                return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(subtractedDeps, null, 4) + ';').then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    cache.cacheFileInfo('deps-from-file', substractFromTargetPath);
                    cache.cacheFileInfo('deps-what-file', subtractWhatTargetPath);
                    _this.node.resolveTarget(depsTarget, subtractedDeps);
                });
            } else {
                _this.node.getLogger().isValid(depsTarget);
                delete require.cache[depsTargetPath];
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});
