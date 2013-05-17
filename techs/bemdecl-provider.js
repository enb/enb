/**
 * bemdecl-provider
 * ================
 *
 * Копирует *bemdecl* в текущую ноду под нужным именем из другой ноды. Может понадобиться, например, для объединения bemdecl'ов.
 *
 * **Опции**
 *
 * * *String* **sourceNodePath** — Путь исходной ноды с нужным bemdecl'ом. Обязательная опция.
 * * *String* **sourceTarget** — Исходный bemdecl, который будет копироваться. По умолчанию — `?.bemdecl.js` (демаскируется в рамках исходной ноды).
 * * *String* **bemdeclTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js` (демаскируется в рамках текущей ноды).
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/bemdecl-provider'), {
 *   sourceNodePath: 'bundles/router',
 *   sourceTarget: 'router.bemdecl.js',
 *   bemdeclTarget: 'router.bemdecl.js'
 * }]);
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
        return 'bemdecl-provider';
    },

    configure: function() {
        this._sourceNodePath = this.getRequiredOption('sourceNodePath');
        this._sourceTarget = this.getOption('sourceTarget', '?.bemdecl.js');
        this._target = this.node.unmaskTargetName(this.getOption('bemdeclTarget', '?.bemdecl.js'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            bemdeclTarget = this._target,
            bemdeclTargetPath = this.node.resolvePath(bemdeclTarget),
            fromNode = this._sourceNodePath,
            cache = this.node.getNodeCache(bemdeclTarget),
            requirements = {},
            sourceTargetName = this.node.unmaskNodeTargetName(fromNode, this._sourceTarget),
            sourceTargetPath = this.node.resolveNodePath(fromNode, sourceTargetName);
        requirements[fromNode] = [sourceTargetName];
        return this.node.requireNodeSources(requirements).then(function(results) {
            var deps = results[fromNode][0];
            if (cache.needRebuildFile('bemdecl-file', bemdeclTargetPath)
                    || cache.needRebuildFile('bemdecl-source-file', sourceTargetPath)) {
                return vowFs.read(sourceTargetPath, 'utf8').then(function(data) {
                    vowFs.write(bemdeclTargetPath, data).then(function() {
                        cache.cacheFileInfo('bemdecl-file', bemdeclTargetPath);
                        cache.cacheFileInfo('bemdecl-source-file', sourceTargetPath);
                        _this.node.resolveTarget(bemdeclTarget, deps);
                    });
                });
            } else {
                _this.node.getLogger().isValid(bemdeclTarget);
                delete require.cache[bemdeclTargetPath];
                _this.node.resolveTarget(bemdeclTarget, require(bemdeclTargetPath).deps);
                return null;
            }
        });
    }
});
