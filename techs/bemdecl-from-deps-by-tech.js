/**
 * bemdecl-from-deps-by-tech
 * =========================
 *
 * Формирует *bemdecl* на основе depsByTech-информации из `?.deps.js`.
 *
 * **Опции**
 *
 * * *String* **sourceTech** — Имя исходной технологии. Обязательная опция.
 * * *String* **destTech** — Имя конечной технологии. Обязательная опция.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **target** — Результирующий bemdecl-таргет. По умолчанию — `?.bemdecl.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/bemdecl-from-deps-by-tech'), {
 *     sourceTech: 'js',
 *     destTech: 'bemhtml'
 * });
 * ```
 */
var Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    vm = require('vm'),
    deps = require('../lib/deps/deps');

/**
 * @type {Tech}
 */
module.exports = require('../lib/build-flow').create()
    .name('bemdecl-from-deps-by-tech')
    .target('target', '?.bemdecl.js')
    .defineRequiredOption('sourceTech')
    .defineRequiredOption('destTech')
    .useFileList('deps.js')
    .builder(function(depsFiles) {
        var sourceTech = this._sourceTech,
            destTech = this._destTech;
        return Vow.all(depsFiles.map(function(file) {
            return vowFs.read(file.fullname, 'utf8').then(function(text) {
                return {file: file, text: text };
            });
        })).then(function(depResults) {
            var result = [],
                depIndex = {};
            depResults.forEach(function(depResult) {
                var fileDeps = vm.runInThisContext(depResult.text);
                fileDeps = Array.isArray(fileDeps) ? fileDeps : [fileDeps];
                fileDeps.forEach(function(dep) {
                    if (dep.tech === sourceTech) {
                        ['mustDeps', 'shouldDeps'].forEach(function(depType) {
                            if (dep[depType]) {
                                deps.flattenDeps(dep[depType]).forEach(function(singleDep) {
                                    if (singleDep.tech === destTech) {
                                        var key = depKey(singleDep);
                                        if (!depIndex[key]) {
                                            depIndex[key] = true;
                                            result.push(singleDep);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            });
            return 'exports.deps = ' + JSON.stringify(result, null, 4) + ';';
        });
    })
    .createTech();


function depKey(dep) {
   return dep.block +
       (dep.elem ? '__' + dep.elem : '') +
       (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}
