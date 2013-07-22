/**
 * deps-provider
 * =============
 *
 * Копирует *deps* в текущую ноду под нужным именем из другой ноды.
 * Может понадобиться, например, для объединения deps'ов.
 *
 * **Опции**
 *
 * * *String* **sourceNodePath** — Путь исходной ноды с нужным deps'ом. Обязательная опция.
 * * *String* **sourceTarget** — Исходный deps, который будет копироваться.
 *   По умолчанию — `?.deps.js` (демаскируется в рамках исходной ноды).
 * * *String* **depsTarget** — Результирующий deps-таргет.
 *   По умолчанию — `?.deps.js` (демаскируется в рамках текущей ноды).
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/deps-provider'), {
 *   sourceNodePath: 'bundles/router',
 *   sourceTarget: 'router.deps.js',
 *   depsTarget: 'router.deps.js'
 * } ]);
 * ```
 */
var Vow = require('vow'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    vowFs = require('../lib/fs/async-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps-provider';
    },

    configure: function() {
        this._sourceNodePath = this.getRequiredOption('sourceNodePath');
        this._sourceTarget = this.getOption('sourceTarget', '?.deps.js');
        this._target = this.node.unmaskTargetName(this.getOption('depsTarget', '?.deps.js'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            depsTarget = this._target,
            depsTargetPath = this.node.resolvePath(depsTarget),
            fromNode = this._sourceNodePath,
            sourceTargetName = this.node.unmaskNodeTargetName(fromNode, this._sourceTarget),
            sourceTargetPath = this.node.resolveNodePath(fromNode, sourceTargetName),
            cache = this.node.getNodeCache(depsTarget),
            requirements = {};
        requirements[fromNode] = [sourceTargetName];
        return this.node.requireNodeSources(requirements).then(function(results) {
            var deps = results[fromNode][0];
            if (cache.needRebuildFile('deps-file', depsTargetPath) ||
                cache.needRebuildFile('source-deps-file', sourceTargetPath)
            ) {
                return vowFs.write(
                    depsTargetPath, 'exports.deps = ' + JSON.stringify(deps, null, 4) + ';'
                ).then(function() {
                    cache.cacheFileInfo('deps-file', depsTargetPath);
                    cache.cacheFileInfo('source-deps-file', sourceTargetPath);
                    _this.node.resolveTarget(depsTarget, deps);
                });
            } else {
                _this.node.isValidTarget(depsTarget);
                delete require.cache[depsTargetPath];
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});
