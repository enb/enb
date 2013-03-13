var inherit = require('inherit'),
    vm = require('vm'),
    fs = require('fs');

module.exports = inherit({

    __constructor: function(levels) {
        this.levels = levels;
        this.declarations = [];
        this.resolved = {};
        this.declarationIndex = {};
    },

    normalizeDep: function(dep, blockName) {
        if (typeof dep === 'string') {
            return [{ name: dep }];
        } else {
            var res = [];
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
                } else {
                    res.push({ name: dep.block || blockName, elem: dep.elem });
                }
            } else if (dep.mods || dep.elems) {
                Object.keys(dep.mods || {}).forEach(function(modName) {
                    var modVals = dep.mods[modName];
                    if (!Array.isArray(modVals)) {
                        modVals = [modVals];
                    }
                    res = res.concat(modVals.map(function(modVal) {
                        return { name: dep.block || blockName, modName: modName, modVal: modVal };
                    }));
                });
                var elems = dep.elems || [];
                if (!Array.isArray(elems)) {
                    elems = [elems];
                }
                res = res.concat(elems.map(function(elem) {
                    return { name: dep.block || blockName, elem: elem };
                }));
            } else {
                res = [{ name: dep.block || blockName }];
            }
            return res;
        }
    },

    normalizeDeps: function(deps, blockName) {
        if (Array.isArray(deps)) {
            var result = [];
            for (var i = 0, l = deps.length; i < l; i++) {
                result = result.concat(this.normalizeDep(deps[i], blockName));
            }
            return result;
        } else {
            return this.normalizeDep(deps, blockName);
        }
    },

    getDeps: function(decl) {
        var dep, _this = this, files, key, mustDecl, mustDepIndex, mustDeps, shouldDepIndex, shouldDeps;
        if (decl.elem) {
            files = this.levels.getElemFiles(decl.name, decl.elem, decl.modName, decl.modVal);
        } else {
            files = this.levels.getBlockFiles(decl.name, decl.modName, decl.modVal);
        }
        files = files.filter(function(file) {
            return file.suffix == 'deps.js';
        });
        mustDepIndex = {};
        shouldDepIndex = {};
        mustDeps = [];
        if (decl.modName) {
            if (decl.elem) {
                mustDecl = { name: decl.name, elem: decl.elem };
            } else {
                mustDecl = { name: decl.name };
            }
            mustDecl.key = declKey(mustDecl);
            mustDepIndex[mustDecl.key] = true;
            mustDeps.push(mustDecl);
        }
        shouldDeps = [];
        files.forEach(function(file) {
            dep = vm.runInThisContext(fs.readFileSync(file.fullname, "utf8"));
            if (dep.mustDeps) {
                _this.normalizeDeps(dep.mustDeps, decl.name).forEach(function(nd) {
                    key = declKey(nd);
                    if (!mustDepIndex[key]) {
                        mustDepIndex[key] = true;
                        nd.key = key;
                        mustDeps.push(nd);
                    }
                });
            }
            if (dep.shouldDeps) {
                _this.normalizeDeps(dep.shouldDeps, decl.name).forEach(function(nd) {
                    key = declKey(nd);
                    if (!shouldDepIndex[key]) {
                        shouldDepIndex[key] = true;
                        nd.key = key;
                        shouldDeps.push(nd);
                    }
                });
            }
            if (dep.noDeps) {
                _this.normalizeDeps(dep.noDeps, decl.name).forEach(function(nd) {
                    key = declKey(nd);
                    nd.key = key;
                    removeFromDeps(nd, mustDepIndex, mustDeps);
                    removeFromDeps(nd, shouldDepIndex, shouldDeps);
                });
            }
        });
        function removeFromDeps(decl, index, list) {
            if (index[decl.key]) {
                for (var i = 0, l = list.length; i < l; i++) {
                    if (list[i].key == decl.key) {
                        return list.splice(i, 1);
                    }
                }
            } else {
                index[decl.key] = true;
            }
            return null;
        }
        return {mustDeps: mustDeps, shouldDeps: shouldDeps};
    },

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

    addElem: function(blockName, elemName, modName, modVal) {
        if (modName) {
            this.addDecl({
                name: blockName,
                elem: elemName,
                modName: modName,
                modVal: modVal
            });
        } else {
            this.addDecl({
                name: blockName,
                elem: elemName
            });
        }
    },

    addDecl: function(decl) {
        var _this = this, key = declKey(decl);
        if (this.declarationIndex[key]) {
            return;
        }
        this.declarations.push(decl);
        this.declarationIndex[key] = decl;
        var deps = this.getDeps(decl);
        decl.key = key;
        decl.deps = {};
        decl.depCount = 0;
        deps.mustDeps.forEach(function(dep) {
            decl.deps[dep.key] = true;
            decl.depCount++;
            _this.addDecl(dep);
        });
        deps.shouldDeps.forEach(function(dep) {
            _this.addDecl(dep);
        });
    },

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
                        item.val = decl.modVal;
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
   return decl.name + (decl.elem ? '__' + decl.elem : '') + (decl.modName ? '_' + decl.modName + '_' + decl.modVal : '');
}
