/**
 * deps
 * ====
 *
 * Быстро собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости. Сохраняет в виде `?.deps.js`.
 * Следует использовать с осторожностью: в bem-bl не хватает зависимостей, потому проект может собраться иначе,
 * чем с помощью bem-tools.
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
 * nodeConfig.addTech(require('enb/techs/deps'));
 * ```
 *
 * Сборка специфического deps:
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/deps'), {
 *   bemdeclTarget: 'search.bemdecl.js',
 *   depsTarget: 'search.deps.js'
 * } ]);
 * ```
 */
var Vow = require('vow'),
    fs = require('graceful-fs'),
    vm = require('vm'),
    vowFs = require('../lib/fs/async-fs'),
    DepsResolver = require('../lib/deps/deps-resolver'),
    inherit = require('inherit'),
    asyncRequire = require('../lib/fs/async-require'),
    dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = inherit(require('../lib/tech/base-tech'), {

    getName: function() {
        return 'deps';
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
        return [this._target];
    },

    build: function() {
        var _this = this,
            depsTarget = this._target,
            depsTargetPath = this.node.resolvePath(depsTarget),
            cache = this.node.getNodeCache(depsTarget),
            bemdeclSource = this._bemdeclTarget,
            bemdeclSourcePath = this.node.resolvePath(bemdeclSource);
        return this.node.requireSources([this._levelsTarget, bemdeclSource]).spread(function(levels) {
            var depFiles = levels.getFilesBySuffix('deps.js').concat(levels.getFilesBySuffix('deps.yaml'));
            if (cache.needRebuildFile('deps-file', depsTargetPath) ||
                cache.needRebuildFile('bemdecl-file', bemdeclSourcePath) ||
                cache.needRebuildFileList('deps-file-list', depFiles)
            ) {
                dropRequireCache(require, bemdeclSourcePath);
                return asyncRequire(bemdeclSourcePath).then(function(bemdecl) {
                    var decls = [],
                        dep = new DepsResolver(levels);

                    if (bemdecl.blocks) {
                        bemdecl.blocks.forEach(function(block) {
                            block.name = block.name || block.block;
                            decls.push({
                                name: block.name
                            });
                            if (block.mods) {
                                [].concat(block.mods).forEach(function(mod) {
                                    if (mod.vals) {
                                        mod.vals.forEach(function(val) {
                                            decls.push({
                                                name: block.name,
                                                modName: mod.name,
                                                modVal: val.name
                                            });
                                        });
                                    } else {
                                        Object.keys(mod).forEach(function (name) {
                                            decls.push({
                                                name: block.name,
                                                modName: name,
                                                modVal: mod[name]
                                            });
                                        })
                                    }
                                });
                            }
                            if (block.elems) {
                                block.elems.forEach(function(elem) {
                                    if (typeof elem === 'string') {
                                        return decls.push({
                                            name: block.name,
                                            elem: elem
                                        });
                                    }
                                    decls.push({
                                        name: block.name,
                                        elem: elem.name
                                    });
                                    if (elem.mods) {
                                        elem.mods.forEach(function(mod) {
                                            if (mod.vals) {
                                                mod.vals.forEach(function(val) {
                                                    decls.push({
                                                        name: block.name,
                                                        elem: elem.name,
                                                        modName: mod.name,
                                                        modVal: val.name
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }

                    if (bemdecl.deps) {
                        decls = decls.concat(dep.normalizeDeps(bemdecl.deps));
                    }

                    return dep.addDecls(decls).then(function() {
                        var resolvedDeps = dep.resolve();
                        return vowFs.write(
                            depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';\n', 'utf8'
                        ).then(function() {
                            cache.cacheFileInfo('deps-file', depsTargetPath);
                            cache.cacheFileInfo('bemdecl-file', bemdeclSourcePath);
                            cache.cacheFileList('deps-file-list', depFiles);
                            _this.node.resolveTarget(depsTarget, resolvedDeps);
                        });
                    });
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
