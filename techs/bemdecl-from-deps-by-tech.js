/**
 * bemdecl-from-deps-by-tech
 * =========================
 *
 * Технология переехала в пакет `enb-bem-techs`.
 */
var Vow = require('vow');
var vowFs = require('../lib/fs/async-fs');
var vm = require('vm');
var deps = require('../lib/deps/deps');

/**
 * @type {Tech}
 */
module.exports = require('../lib/build-flow').create()
    .name('bemdecl-from-deps-by-tech')
    .deprecated('enb', 'enb-bem-techs', 'deps-by-tech-to-bemdecl')
    .target('target', '?.bemdecl.js')
    .defineRequiredOption('sourceTech')
    .defineRequiredOption('destTech')
    .useFileList('deps.js')
    .builder(function (depsFiles) {
        var sourceTech = this._sourceTech;
        var destTech = this._destTech;
        return Vow.all(depsFiles.map(function (file) {
            return vowFs.read(file.fullname, 'utf8').then(function (text) {
                return {file: file, text: text };
            });
        })).then(function (depResults) {
            var result = [];
            var depIndex = {};
            depResults.forEach(function (depResult) {
                var fileDeps = vm.runInThisContext(depResult.text);
                if (!fileDeps) {
                    return;
                }
                fileDeps = Array.isArray(fileDeps) ? fileDeps : [fileDeps];
                fileDeps.forEach(function (dep) {
                    if (dep.tech === sourceTech) {
                        ['mustDeps', 'shouldDeps'].forEach(function (depType) {
                            if (dep[depType]) {
                                deps.flattenDeps(dep[depType]).forEach(function (singleDep) {
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
