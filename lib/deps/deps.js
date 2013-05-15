/**
 * Набор утилит для работы с deps'ами.
 * @type {Object}
 */
module.exports = {

    /**
     * Объединяет deps'ы.
     * @param {Array} depsToMerge
     * @returns {Array}
     */
    merge: function(depsToMerge) {
        depsToMerge = [].concat(depsToMerge);
        var startingDep = depsToMerge.shift(),
            index = buildDepsIndex(startingDep),
            result = [].concat(startingDep),
            currentDep, dep, key;
        while (currentDep = depsToMerge.shift()) {
            for (var i = 0, l = currentDep.length; i < l; i++) {
                dep = currentDep[i];
                key = depKey(dep);
                if (!index[key]) {
                    result.push(dep);
                    index[key] = true;
                }
            }
        }
        return result;
    },

    /**
     * Вычитает deps'ы.
     * @param {Array} from
     * @param {Array} what
     * @returns {Array}
     */
    subtract: function(from, what) {
        var whatIndex = buildDepsIndex(what);
        return from.filter(function(dep) {
            return !whatIndex[depKey(dep)];
        });
    },

    /**
     * Переводит bemdecl в deps'ы (без раскрытия).
     * @param {Object} bemdecl
     * @returns {Array}
     */
    fromBemdecl: function(bemdecl) {
        if (bemdecl.blocks) {
            var res = [];
            bemdecl.blocks.forEach(function(block) {
                res.push({ block: block.name });
                if (block.mods) {
                    block.mods.forEach(function(mod) {
                        if (mod.vals) {
                            mod.vals.forEach(function(val) {
                                res.push({ block: block.name, mod: mod.name, val: val.name});
                            });
                        }
                    });
                }
                if (block.elems) {
                    block.elems.forEach(function(elem){
                        res.push({ block: block.name, elem: elem.name });
                        if (elem.mods) {
                            elem.mods.forEach(function(mod) {
                                if (mod.vals) {
                                    mod.vals.forEach(function(val) {
                                        res.push({ block: block.name, elem: elem.name, mod: mod.name, val: val.name });
                                    });
                                }
                            });
                        }
                    });
                }
            });
            return res;
        } else {
            return this.flattenDeps(bemdecl.deps || []);
        }
    },

    /**
     * Конвертирует шорткаты депсов в массив без шорткатов.
     * @param {Object} dep
     * @param {String} [blockName]
     * @returns {Array}
     */
    flattenDep: function(dep, blockName) {
        if (typeof dep === 'string') {
            return [{ block: dep }];
        } else {
            var res = [];
            if (!dep.block) {
                dep.block = blockName;
            }
            if (dep.elem) {
                if (dep.mods) {
                    Object.keys(dep.mods).forEach(function(modName) {
                        var modVals = dep.mods[modName];
                        if (!Array.isArray(modVals)) {
                            modVals = [modVals];
                        }
                        res = res.concat(modVals.map(function(modVal) {
                            return { block: dep.block, elem: dep.elem, mod: modName, val: modVal };
                        }));
                    });
                } else {
                    res.push({ block: dep.block, elem: dep.elem });
                }
            } else if (dep.mods || dep.elems) {
                Object.keys(dep.mods || {}).forEach(function(modName) {
                    var modVals = dep.mods[modName];
                    if (!Array.isArray(modVals)) {
                        modVals = [modVals];
                    }
                    res = res.concat(modVals.map(function(modVal) {
                        return { block: dep.block, mod: modName, val: modVal };
                    }));
                });
                if (dep.elems) {
                    res.push({ block: dep.block });
                    var elems = dep.elems || [];
                    if (!Array.isArray(elems)) {
                        elems = [elems];
                    }
                    elems.forEach(function(elem) {
                        if (typeof elem == 'object') {
                            res.push({ block: dep.block, elem: elem.elem });
                            Object.keys(elem.mods || {}).forEach(function(modName) {
                                var modVals = elem.mods[modName];
                                if (!Array.isArray(modVals)) {
                                    modVals = [modVals];
                                }
                                res = res.concat(modVals.map(function(modVal) {
                                    return { block: dep.block, elem: elem.elem, mod: modName, val: modVal };
                                }));
                            });
                        } else {
                            res.push({ block: dep.block, elem: elem });
                        }
                    });
                }
            } else {
                res = [{ block: dep.block }];
            }
            if (dep.tech) {
                res.forEach(function (resDep) {
                    resDep.tech = dep.tech;
                });
            }
            return res;
        }
    },

    /**
     * Корвертирует набор шорткатов депсов в массив без шорткатов.
     * @param {Array|Object} deps
     * @returns {Array}
     */
    flattenDeps: function(deps) {
        if (Array.isArray(deps)) {
            var result = [];
            for (var i = 0, l = deps.length; i < l; i++) {
                result = result.concat(this.flattenDep(deps[i]));
            }
            return result;
        } else {
            return this.flattenDep(deps);
        }
    }
};

function depKey(dep) {
   return dep.block + (dep.elem ? '__' + dep.elem : '') + (dep.mod ? '_' + dep.mod + (dep.val ? '_' + dep.val : '') : '');
}

function buildDepsIndex(deps) {
    var result = {};
    for (var i = 0, l = deps.length; i < l; i++) {
        result[depKey(deps[i])] = true;
    }
    return result;
}
