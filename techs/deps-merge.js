/**
 * deps-merge
 * ==========
 */
var Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps');

/**
 *
 * Формирует *deps* с помощью объединения других deps-файлов.
 *
 * **Опции**
 *
 * * *String[]* **depsSources** — Исходные deps-таргеты. Обязательная опция.
 * * *String* **depsTarget** — Результирующий deps-таргет. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/deps-merge'))({
 *   depsSources: ['search.deps.js', 'router.deps.js'],
 *   depsTarget: 'all.deps.js'
 * } ]);
 * ```
 * @type {Tech}
 */
module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps-merge';
    },

    configure: function() {
        var _this = this;
        this._sources = this.getRequiredOption('depsSources').map(function(source) {
            return _this.node.unmaskTargetName(source);
        });
        this._target = this.node.unmaskTargetName(
            this.getOption('depsTarget', this.node.getTargetName('deps.js')));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var _this = this,
            depsTarget = this.node.unmaskTargetName(this._target),
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            sources = this._sources;
        return this.node.requireSources(sources).then(function(depResults) {
            var rebuildNeeded = cache.needRebuildFile('deps-file', depsTargetPath);
                if (!rebuildNeeded) {
                sources.forEach(function(source) {
                    if (cache.needRebuildFile(source, _this.node.resolvePath(source))) {
                        rebuildNeeded = true;
                    }
                });
            }
            if (rebuildNeeded) {
                var mergedDeps = deps.merge(depResults);
                return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(mergedDeps) + ';').then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    sources.forEach(function(source) {
                        cache.cacheFileInfo(source, _this.node.resolvePath(source));
                    });
                    _this.node.resolveTarget(depsTarget, mergedDeps);
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
