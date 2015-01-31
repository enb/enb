/**
 * bemdecl-from-bemjson
 * ====================
 *
 * Технология переехала в пакет `enb-bem-techs`.
 *
 */
var asyncOrEval = require('../lib/fs/require-or-eval');

/**
 * @type {Tech}
 */
module.exports = require('../lib/build-flow').create()
    .name('bemdecl-from-bemjson')
    .deprecated('enb', 'enb-bem-techs', 'bemjson-to-bemdecl')
    .target('destTarget', '?.bemdecl.js')
    .useSourceFilename('sourceTarget', '?.bemjson.js')
    .builder(function (bemjsonFilename) {
        return asyncOrEval(bemjsonFilename).then(function (json) {
            var deps = [];
            addDepsFromBemjson(json, deps, {}, null);
            return 'exports.deps = ' + JSON.stringify(deps, null, 4) + ';\n';
        });
    })
    .createTech();

function addDepsFromBemjson(bemjson, deps, depsIndex, parentBlockName) {
    if (Array.isArray(bemjson)) {
        bemjson.forEach(function (bemjsonItem) {
            addDepsFromBemjson(bemjsonItem, deps, depsIndex, parentBlockName);
        });
    } else {
        if (bemjson.block || bemjson.elem) {
            if (bemjson.elem && !bemjson.block) {
                bemjson.block = parentBlockName;
            }
            var dep = {block: bemjson.block};
            if (bemjson.elem) {
                dep.elem = bemjson.elem;
            }
            var itemKey = depKey(dep);
            if (!depsIndex[itemKey]) {
                deps.push(dep);
                depsIndex[itemKey] = true;
            }
            if (bemjson.elemMods) {
                bemjson.mods = bemjson.elemMods;
            }
            if (bemjson.view && typeof bemjson.view === 'string') {
                (bemjson.mods || (bemjson.mods = {})).view = bemjson.view;
            }
            if (bemjson.mods) {
                for (var j in bemjson.mods) {
                    if (bemjson.mods.hasOwnProperty(j)) {
                        var subDep = {block: bemjson.block};
                        if (bemjson.elem) {
                            subDep.elem = bemjson.elem;
                        }
                        subDep.mod = j;
                        subDep.val = bemjson.mods[j];
                        var subItemKey = depKey(subDep);
                        if (!depsIndex[subItemKey]) {
                            deps.push(subDep);
                            depsIndex[subItemKey] = true;
                        }
                    }
                }
            }
        }
        for (var i in bemjson) {
            if (bemjson.hasOwnProperty(i)) {
                if (i !== 'mods' && i !== 'js' && i !== 'attrs') {
                    var value = bemjson[i];
                    if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                        addDepsFromBemjson(bemjson[i], deps, depsIndex, bemjson.block || parentBlockName);
                    }
                }
            }
        }
    }
}

function depKey(dep) {
   return dep.block +
       (dep.elem ? '__' + dep.elem : '') +
       (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}
