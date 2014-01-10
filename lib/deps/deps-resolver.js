/**
 * DepsResolver
 * ============
 */

var inherit = require('inherit'),
    vm = require('vm'),
    fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('../fs/async-fs'),
    yaml = require('js-yaml'),
    requireOrEval = require('../fs/require-or-eval');

function DepsError(message) {
    this.message = message;
    Error.captureStackTrace(this, DepsError);
}
DepsError.prototype = Object.create(Error.prototype);
DepsError.prototype.name = 'Deps error';

/**
 * DepsResolver — класс, раскрывающий deps'ы.
 * @name DepsResolver
 */
module.exports = inherit({

    /**
     * Конструктор.
     * @param {Level[]} levels
     */
    __constructor: function(levels) {
        this.levels = levels;
        this.declarations = [];
        this.resolved = {};
        this.declarationIndex = {};
    },

    /**
     * Раскрывает шорткаты deps'а.
     * @param {String|Object} dep
     * @param {String} blockName
     * @param {String} elemName
     * @returns {Array}
     */
    normalizeDep: function(dep, blockName, elemName) {
        var levels = this.levels;
        if (typeof dep === 'string') {
            return [{ name: dep }];
        } else {
            var res = [];
            if (!dep || !(dep instanceof Object)) {
                throw new DepsError('Deps shoud be instance of Object or String');
            }
            if (dep.view) {
                (dep.mods || (dep.mods = {})).view = dep.view;
            }
            if (dep.skin) {
                (dep.mods || (dep.mods = {})).skin = dep.skin;
            }
            if (dep.elem) {
                if (dep.mods) {
                    Object.keys(dep.mods).forEach(function(modName) {
                        var modVals = dep.mods[modName];
                        if (!Array.isArray(modVals)) {
                            modVals = [modVals];
                        }
                        res = res.concat(modVals.map(function(modVal) {
                            return { name: dep.block || blockName, elem: dep.elem, modName: modName, modVal: modVal };
                        }));
                    });
                } else if (dep.mod) {
                    res.push({ name: dep.block || blockName, elem: dep.elem, modName: dep.mod, modVal: dep.val });
                } else {
                    res.push({ name: dep.block || blockName, elem: dep.elem });
                }
            } else if (dep.mod || dep.mods || dep.elems) {
                if (dep.mod) {
                    res.push({ name: dep.block || blockName, modName: dep.mod, modVal: dep.val });
                }
                Object.keys(dep.mods || {}).forEach(function(modName) {
                    var modVals = dep.mods[modName];
                    if (modVals === '*') {
                        modVals = levels.getModValues(dep.block || blockName, modName);
                    }
                    if (!Array.isArray(modVals)) {
                        modVals = [modVals];
                    }
                    res = res.concat(modVals.map(function(modVal) {
                        if (elemName && !dep.block && !dep.elem) {
                            return { name: dep.block || blockName, elem: elemName, modName: modName, modVal: modVal };
                        } else {
                            return { name: dep.block || blockName, modName: modName, modVal: modVal };
                        }
                    }));
                });
                if (dep.elems) {
                    res.push({ name: dep.block || blockName });
                    var elems = dep.elems || [];
                    if (!Array.isArray(elems)) {
                        elems = [elems];
                    }
                    elems.forEach(function(elem) {
                        if (typeof elem === 'object') {
                            res.push({ name: dep.block || blockName, elem: elem.elem });
                            Object.keys(elem.mods || {}).forEach(function(modName) {
                                var modVals = elem.mods[modName];
                                if (!Array.isArray(modVals)) {
                                    modVals = [modVals];
                                }
                                res = res.concat(modVals.map(function(modVal) {
                                    return {
                                        name: dep.block || blockName,
                                        elem: elem.elem,
                                        modName: modName,
                                        modVal: modVal
                                    };
                                }));
                            });
                        } else {
                            res.push({ name: dep.block || blockName, elem: elem });
                        }
                    });
                }
            } else {
                res = [{ name: dep.block || blockName }];
            }
            if (dep.required) {
                res.forEach(function (subDep) {
                    subDep.required = true;
                });
            }
            return res;
        }
    },

    /**
     * Раскрывает шорткаты для списка deps'ов.
     * @param {String|Object|Array} deps
     * @param {String} [blockName]
     * @param {String} [elemName]
     * @returns {Array}
     */
    normalizeDeps: function(deps, blockName, elemName) {
        if (Array.isArray(deps)) {
            var result = [];
            for (var i = 0, l = deps.length; i < l; i++) {
                result = result.concat(this.normalizeDep(deps[i], blockName, elemName));
            }
            return result;
        } else {
            return this.normalizeDep(deps, blockName, elemName);
        }
    },

    /**
     * Возвращает deps'ы для декларации (с помощью levels).
     * @param {Object} decl
     * @returns {{mustDeps: Array, shouldDeps: Array}}
     */
    getDeps: function(decl) {
        var _this = this, files, key, mustDecls, mustDepIndex, mustDeps, shouldDepIndex, shouldDeps;
        if (decl.elem) {
            files = this.levels.getElemFiles(decl.name, decl.elem, decl.modName, decl.modVal);
        } else {
            files = this.levels.getBlockFiles(decl.name, decl.modName, decl.modVal);
        }
        files = files.filter(function(file) {
            return file.suffix === 'deps.js' || file.suffix === 'deps.yaml';
        });
        mustDepIndex = {};
        shouldDepIndex = {};
        mustDepIndex[declKey(decl)] = true;
        mustDeps = [];
        if (decl.modName) {
            if (decl.elem) {
                mustDecls = [
                    { name: decl.name, elem: decl.elem }
                ];
                if (decl.modVal) {
                    mustDecls.push({ name: decl.name, elem: decl.elem, modName: decl.modName });
                }
            } else {
                mustDecls = [
                    { name: decl.name }
                ];
                if (decl.modVal) {
                    mustDecls.push({ name: decl.name, modName: decl.modName });
                }
            }
            mustDecls.forEach(function(mustDecl) {
                mustDecl.key = declKey(mustDecl);
                mustDepIndex[mustDecl.key] = true;
                mustDeps.push(mustDecl);
            });
        }
        shouldDeps = [];

        function keepWorking(file) {
            if (file.suffix === 'deps.js') {
                return requireOrEval(file.fullname).then(function(depData) {
                    depData = Array.isArray(depData) ? depData : [depData];
                    depData.forEach(function(dep) {
                        if (!dep.tech) {
                            if (dep.mustDeps) {
                                _this.normalizeDeps(dep.mustDeps, decl.name, decl.elem).forEach(function(nd) {
                                    key = declKey(nd);
                                    if (!mustDepIndex[key]) {
                                        mustDepIndex[key] = true;
                                        nd.key = key;
                                        mustDeps.push(nd);
                                    }
                                });
                            }
                            if (dep.shouldDeps) {
                                _this.normalizeDeps(dep.shouldDeps, decl.name, decl.elem).forEach(function(nd) {
                                    key = declKey(nd);
                                    if (!shouldDepIndex[key]) {
                                        shouldDepIndex[key] = true;
                                        nd.key = key;
                                        shouldDeps.push(nd);
                                    }
                                });
                            }
                            if (dep.noDeps) {
                                _this.normalizeDeps(dep.noDeps, decl.name, decl.elem).forEach(function(nd) {
                                    key = declKey(nd);
                                    nd.key = key;
                                    removeFromDeps(nd, mustDepIndex, mustDeps);
                                    removeFromDeps(nd, shouldDepIndex, shouldDeps);
                                });
                            }
                        }
                    });

                    if (files.length > 0) {
                        return keepWorking(files.shift());
                    } else {
                        return null;
                    }
                });
            }

            if (file.suffix === 'deps.yaml') {
                return vowFs.read(file.fullname, 'utf8').then(function(depContent) {
                    var depYamlStructure = yaml.safeLoad(depContent, {
                        filename: file.fullname,
                        strict: true
                    });
                    if (!Array.isArray(depYamlStructure)) {
                        throw new Error('Invalid yaml deps structure at: ' + file.fullname);
                    }
                    _this.normalizeDeps(depYamlStructure, decl.name, decl.elem).forEach(function(nd) {
                        key = declKey(nd);
                        var index;
                        var depList;
                        if (nd.required) {
                            index = mustDepIndex;
                            depList = mustDeps;
                        } else {
                            index = shouldDepIndex;
                            depList = shouldDeps;
                        }
                        if (!index[key]) {
                            index[key] = true;
                            nd.key = key;
                            depList.push(nd);
                        }
                    });
                }).fail(function (err) {
                    if (err instanceof DepsError) {
                        err.message += ' in file "' + file.fullname + '"';
                    }
                    throw err;
                });
            }
        }

        function removeFromDeps(decl, index, list) {
            if (index[decl.key]) {
                for (var i = 0, l = list.length; i < l; i++) {
                    if (list[i].key === decl.key) {
                        return list.splice(i, 1);
                    }
                }
            } else {
                index[decl.key] = true;
            }
            return null;
        }

        var result = { mustDeps: mustDeps, shouldDeps: shouldDeps };

        if (files.length > 0) {
            return keepWorking(files.shift()).then(function() {
                return result;
            });
        } else {
            return Vow.fulfill(result);
        }
    },

    /**
     * Добавляет декларацию блока в резолвер.
     * @param {String} blockName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Promise}
     */
    addBlock: function(blockName, modName, modVal) {
        if (modName) {
            this.addDecl({
                name: blockName,
                modName: modName,
                modVal: modVal
            });
        } else {
            this.addDecl({
                name: blockName
            });
        }
    },

    /**
     * Добавляет декларацию элемента в резолвер.
     * @param {String} blockName
     * @param {String} elemName
     * @param {String} modName
     * @param {String} modVal
     * @returns {Promise}
     */
    addElem: function(blockName, elemName, modName, modVal) {
        if (modName) {
            return this.addDecl({
                name: blockName,
                elem: elemName,
                modName: modName,
                modVal: modVal
            });
        } else {
            return this.addDecl({
                name: blockName,
                elem: elemName
            });
        }
    },

    /**
     * Добавляет декларацию в резолвер.
     * @param {Object} decl
     * @returns {Promise}
     */
    addDecl: function(decl) {
        var _this = this, key = declKey(decl);
        if (this.declarationIndex[key]) {
            return null;
        }
        this.declarations.push(decl);
        this.declarationIndex[key] = decl;
        return this.getDeps(decl).then(function(deps) {
            decl.key = key;
            decl.deps = {};
            decl.depCount = 0;
            return _this.addDecls(deps.mustDeps, function(dep) {
                decl.deps[dep.key] = true;
                decl.depCount++;
            }).then(function() {
                    return _this.addDecls(deps.shouldDeps);
                });
        });
    },

    /**
     * Добавляет набор деклараций.
     * @param {Array} decls
     * @returns {Promise}
     * @param {Function} [preCallback]
     */
    addDecls: function(decls, preCallback) {
        var promise = Vow.fulfill();
        var _this = this;
        decls.forEach(function(decl) {
            promise = promise.then(function() {
                if (preCallback) {
                    preCallback(decl);
                }
                return _this.addDecl(decl);
            });
        });
        return promise;
    },

    /**
     * Упорядочивает deps'ы, возвращает в порядке зависимостей.
     * @returns {Array}
     */
    resolve: function() {
        var decl, hasChanges, item, items, newItems, result, subDecl, i, j, l;
        items = this.declarations.slice(0);
        result = [];
        hasChanges = true;
        while (hasChanges) {
            newItems = [];
            hasChanges = false;
            for (i = 0, l = items.length; i < l; i++) {
                decl = items[i];
                if (decl.depCount === 0) {
                    hasChanges = true;
                    for (j = 0; j < l; j++) {
                        subDecl = items[j];
                        if (subDecl.deps[decl.key]) {
                            delete subDecl.deps[decl.key];
                            subDecl.depCount--;
                        }
                    }
                    item = {
                        block: decl.name
                    };
                    if (decl.elem) {
                        item.elem = decl.elem;
                    }
                    if (decl.modName) {
                        item.mod = decl.modName;
                        if (decl.hasOwnProperty('modVal')) {
                            item.val = decl.modVal;
                        }
                    }
                    result.push(item);
                } else {
                    newItems.push(decl);
                }
            }
            items = newItems;
        }
        if (items.length) {
            var errorMessage = items.map(function(item) {
                return item.key + ' <- ' + Object.keys(item.deps).join(', ');
            });
            throw Error('Unresolved deps: \n' + errorMessage.join('\n'));
        }
        return result;
    }
});

function declKey(decl) {
    return decl.name + (decl.elem ? '__' + decl.elem : '') +
        (decl.modName ? '_' + decl.modName + (decl.modVal ? '_' + decl.modVal : '') : '');
}
