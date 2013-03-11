var Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm');


function DepsTech() {}

DepsTech.prototype = {
    getName: function() {
        return 'deps';
    },

    init: function(node) {
        this.node = node;
    },

    getTargets: function() {
        return [this.node.getTargetName('deps.js')];
    },

    build: function() {
        var depsTarget, depsTargetPath, promise,
            _this = this;
        promise = Vow.promise();
        depsTarget = this.node.getTargetName('deps.js');
        depsTargetPath = this.node.resolvePath(depsTarget);
        this.node.requireSources([this.node.getTargetName('bemdecl.js'), this.node.getTargetName('levels')]).spread((function(bemdecl, levels) {
            try {
                var bemdecl = require(_this.node.resolvePath(_this.node.getTargetName('bemdecl.js'))),
                    dep = new Dep(levels);
                bemdecl.blocks.forEach(function(block) {
                    dep.addBlock(block.name);
                    if (block.mods) {
                        block.mods.forEach(function(mod) {
                            if (mod.vals) {
                                mod.vals.forEach(function(val) {
                                    dep.addBlock(block.name, mod.name, val.name);
                                });
                            }
                        });
                    }
                    if (block.elems) {
                        block.elems.forEach(function(elem){
                            dep.addElem(block.name, elem.name);
                        });
                    }
                });
                var resolvedDeps = dep.resolve();
                fs.writeFileSync(depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps) + ';');
                _this.node.resolveTarget(depsTarget, resolvedDeps);
                return promise.fulfill();
            } catch (err) {
                return promise.reject(err);
            }
        }), function(err) {
            return promise.reject(err);
        });
        return promise;
    },

    clean: function() {
        return this.cleanTarget(this.node.getTargetName('deps.js'));
    },

    cleanTarget: function(target) {
        var targetPath = this.node.resolvePath(target);
        if (fs.existsSync(targetPath)) {
            fs.unlinkSync(this.node.resolvePath(target));
            this.node.getLogger().logClean(target);
        }
    }
};

function declKey(decl) {
   return decl.name + (decl.elem ? '__' + decl.elem : '') + (decl.modName ? '_' + decl.modName + '_' + decl.modVal : '');
}

function Dep(levels) {
    this.levels = levels;
    this.declarations = [];
    this.resolved = {};
    this.declarationIndex = {};
}

Dep.prototype.normalizeDep = function(dep, blockName) {
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
        } else if (dep.mods) {
            Object.keys(dep.mods).forEach(function(modName) {
                    var modVals = dep.mods[modName];
                    if (!Array.isArray(modVals)) {
                        modVals = [modVals];
                    }
                    res = res.concat(modVals.map(function(modVal) {
                        return { name: dep.block || blockName, modName: modName, modVal: modVal };
                    }));
            });
        } else if (dep.elems) {
            var elems = dep.elems;
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
};

Dep.prototype.normalizeDeps = function(deps, blockName) {
    var dep, result, _i, _len;
    if (Array.isArray(deps)) {
        result = [];
        for (_i = 0, _len = deps.length; _i < _len; _i++) {
            dep = deps[_i];
            result = result.concat(this.normalizeDep(dep, blockName));
        }
        return result;
    } else {
        return this.normalizeDep(deps, blockName);
    }
};

Dep.prototype.getDeps = function(decl) {
    var dep, file, files, key, mustDecl, mustDepIndex, mustDeps, nd, shouldDepIndex, shouldDeps, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
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
    for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        dep = vm.runInThisContext(fs.readFileSync(file.fullname, "utf8"));
        if (dep.mustDeps) {
            _ref = this.normalizeDeps(dep.mustDeps, decl.name);
            for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
                nd = _ref[_j];
                key = declKey(nd);
                if (!mustDepIndex[key]) {
                    mustDepIndex[key] = true;
                    nd.key = key;
                    mustDeps.push(nd);
                }
            }
        }
        if (dep.shouldDeps) {
            _ref1 = this.normalizeDeps(dep.shouldDeps, decl.name);
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                nd = _ref1[_k];
                key = declKey(nd);
                if (!shouldDepIndex[key]) {
                    shouldDepIndex[key] = true;
                    shouldDeps.push(nd);
                }
            }
        }
    }
    return [mustDeps, shouldDeps];
};

Dep.prototype.addBlock = function(blockName, modName, modVal) {
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
};

Dep.prototype.addElem = function(blockName, elemName, modName, modVal) {
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
};

Dep.prototype.addDecl = function(decl) {
    var dep, deps, key, _i, _j, _len, _len1, _ref, _ref1;
    key = declKey(decl);
    if (this.declarationIndex[key]) {
        return;
    }
    this.declarations.push(decl);
    this.declarationIndex[key] = decl;
    deps = this.getDeps(decl);
    decl.key = key;
    decl.deps = {};
    decl.depCount = 0;
    _ref = deps[0];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        dep = _ref[_i];
        decl.deps[dep.key] = true;
        decl.depCount++;
        this.addDecl(dep);
    }
    _ref1 = deps[1];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        dep = _ref1[_j];
        this.addDecl(dep);
    }
};

Dep.prototype.resolve = function() {
    var decl, hasChanges, item, items, newItems, result, subDecl, _i, _j, _len, _len1;
    items = this.declarations.slice(0);
    result = [];
    hasChanges = true;
    while (hasChanges) {
        newItems = [];
        hasChanges = false;
        for (_i = 0, _len = items.length; _i < _len; _i++) {
            decl = items[_i];
            if (decl.depCount === 0) {
                hasChanges = true;
                for (_j = 0, _len1 = items.length; _j < _len1; _j++) {
                    subDecl = items[_j];
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
};

module.exports = DepsTech;
