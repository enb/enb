/**
 * deps-old
 * ========
 *
 * Собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости.
 * Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.
 *
 * **Опции**
 *
 * * *String* **bemdeclTarget** — Исходный bemdecl. По умолчанию — `?.bemdecl.js`.
 * * *String* **levelsTarget** — Исходный levels. По умолчанию — `?.levels`.
 * * *String* **depsTarget** — Результирующий deps. По умолчанию — `?.deps.js`.
 *
 * **Пример**
 *
 * Обычное использование:
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/deps-old'));
 * ```
 *
 * Сборка специфического deps:
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/deps-old'), {
 * bemdeclTarget: 'search.bemdecl.js',
 * depsTarget: 'search.deps.js'
 * } ]);
 * ```
 */
var Vow = require('vow'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    vowFs = require('../lib/fs/async-fs'),
    inherit = require('inherit'),
    deps = require('../lib/deps/deps'),
    OldDeps = require('../exlib/deps').OldDeps,
    asyncRequire = require('../lib/fs/async-require'),
    dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'deps-old';
    },

    configure: function() {
        this._target = this.node.unmaskTargetName(
            this.getOption('depsTarget', this.node.getTargetName('deps.js')));
        this._bemdeclTarget = this.node.unmaskTargetName(
            this.getOption('bemdeclTarget', this.node.getTargetName('bemdecl.js')));
        this._levelsTarget = this.node.unmaskTargetName(
            this.getOption('levelsTarget', this.node.getTargetName('levels')));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    build: function() {
        var _this = this,
            depsTarget = this._target,
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            bemdeclSource = this._bemdeclTarget,
            bemdeclSourcePath = this.node.resolvePath(bemdeclSource);
        return this.node.requireSources([this._levelsTarget, bemdeclSource]).spread(function(levels) {
            var depFiles = levels.getFilesBySuffix('deps.js');
            if (cache.needRebuildFile('deps-file', depsTargetPath) ||
                cache.needRebuildFile('bemdecl-file', bemdeclSourcePath) ||
                cache.needRebuildFileList('deps-file-list', depFiles)
            ) {
                dropRequireCache(require, bemdeclSourcePath);
                return asyncRequire(bemdeclSourcePath).then(function(bemdecl) {
                    return (new OldDeps(deps.toBemdecl(bemdecl)).expandByFS({
                        levels: levels
                    }).then(function(resolvedDeps) {
                        resolvedDeps = resolvedDeps.getDeps();
                        return vowFs.write(
                            depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';\n', 'utf8'
                        ).then(function() {
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
