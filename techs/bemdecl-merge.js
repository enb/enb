/**
 * bemdecl-merge
 * =============
 *
 * Формирует *bemdecl* с помощью объединения других bemdecl-файлов.
 *
 ***Опции**
 *
 ** *String[]* **bemdeclSources** — Исходные bemdecl-таргеты. Обязательная опция.
 ** *String* **bemdeclTarget** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 *
 ***Пример**
 *
 *```javascript
 *nodeConfig.addTech([ require('enb/techs/bemdecl-merge'), {
 *  bemdeclSources: ['search.bemdecl.js', 'router.bemdecl.js'],
 *  bemdeclTarget: 'all.bemdecl.js'
 *} ]);
 *```
 */
var Vow = require('vow'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'bemdecl-merge';
    },

    configure: function() {
        var _this = this;
        this._sources = this.getRequiredOption('bemdeclSources').map(function(source) {
            return _this.node.unmaskTargetName(source);
        });
        this._target = this.node.unmaskTargetName(this.getOption('bemdeclTarget', '?.bemdecl.js'));
    },

    getTargets: function() {
        return [this._target];
    },

    build: function() {
        var _this = this,
            bemdeclTarget = this.node.unmaskTargetName(this._target),
            bemdeclTargetPath = this.node.resolvePath(bemdeclTarget),
            cache = this.node.getNodeCache(bemdeclTarget),
            sources = this._sources;
        return this.node.requireSources(sources).then(function() {
            var rebuildNeeded = cache.needRebuildFile('bemdecl-file', bemdeclTargetPath);
                if (!rebuildNeeded) {
                sources.forEach(function(source) {
                    if (cache.needRebuildFile(source, _this.node.resolvePath(source))) {
                        rebuildNeeded = true;
                    }
                });
            }
            if (rebuildNeeded) {
                var bemdeclResults = [];
                sources.forEach(function(source) {
                    var sourcePath = _this.node.resolvePath(source);
                    delete require.cache[sourcePath];
                    bemdeclResults.push(require(sourcePath));
                });
                var mergedDeps = deps.merge(bemdeclResults.map(function(bemdecl) {
                    return deps.fromBemdecl(bemdecl);
                }));
                return vowFs.write(
                    bemdeclTargetPath, 'exports.deps = ' + JSON.stringify(mergedDeps) + ';'
                ).then(function() {
                    cache.cacheFileInfo('bemdecl-file', bemdeclTargetPath);
                    sources.forEach(function(source) {
                        cache.cacheFileInfo(source, _this.node.resolvePath(source));
                    });
                    _this.node.resolveTarget(bemdeclTarget, mergedDeps);
                });
            } else {
                _this.node.isValidTarget(bemdeclTarget);
                delete require.cache[bemdeclTargetPath];
                _this.node.resolveTarget(bemdeclTarget, require(bemdeclTargetPath).deps);
                return null;
            }
        });
    }
});
