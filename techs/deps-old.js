/**
 * deps-old
 * ========
 *
 * Собирает *deps.js*-файл на основе *levels* и *bemdecl*, раскрывая зависимости. Сохраняет в виде `?.deps.js`. Использует алгоритм, заимствованный из bem-tools.
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
 *   bemdeclTarget: 'search.bemdecl.js',
 *   depsTarget: 'search.deps.js'
 * } ]);
 * ```
 */
var Vow = require('vow'),
    fs = require('fs'),
    vm = require('vm'),
    vowFs = require('vow-fs'),
    inherit = require('inherit');

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
            if (cache.needRebuildFile('deps-file', depsTargetPath)
                    || cache.needRebuildFile('bemdecl-file', bemdeclSourcePath)
                    || cache.needRebuildFileList('deps-file-list', depFiles)) {
                var bemdecl = require(bemdeclSourcePath);
                return (new OldDeps(bemdecl.blocks || bemdecl.deps)).expandByFS({
                    levels: levels
                }).then(function(resolvedDeps) {
                    resolvedDeps = resolvedDeps.getDeps();
                    return vowFs.write(depsTargetPath, 'exports.deps = ' + JSON.stringify(resolvedDeps, null, 4) + ';', 'utf8').then(function() {
                        cache.cacheFileInfo('deps-file', depsTargetPath);
                        cache.cacheFileInfo('bemdecl-file', bemdeclSourcePath);
                        cache.cacheFileList('deps-file-list', depFiles);
                        _this.node.resolveTarget(depsTarget, resolvedDeps);
                    });
                });
            } else {
                _this.node.getLogger().isValid(depsTarget);
                delete require.cache[depsTargetPath];
                _this.node.resolveTarget(depsTarget, require(depsTargetPath).deps);
                return null;
            }
        });
    }
});

// --- (C) Original BEM Tools, modified for compatibility.

var OldDeps = (function() {
    var Deps = exports.Deps = inherit({

        __constructor: function(deps) {
            this.items = {};
            this.itemsByOrder = [];
            this.uniqExpand = {};

            // Force adding of root item to this.items
            var rootItem = this.rootItem = new DepsItem({});
            this.items[rootItem.buildKey()] = rootItem;

            deps && this.parse(deps);
        },

        add: function(target, depsType, item) {
            var items = this.items,
                targetKey = target.buildKey(),
                itemKey = item.buildKey();

            if(!items[itemKey]) {
                items[itemKey] = item;
                this.itemsByOrder.push(itemKey);
            }

            (items[targetKey] || (items[targetKey] = target))[depsType].push(itemKey);
        },

        remove: function(target, item) {
            target = this.items[target.buildKey()];
            var itemKey = item.buildKey();
            removeFromArray(target.shouldDeps, itemKey);
            removeFromArray(target.mustDeps, itemKey);
        },

        clone: function(target) {
            target || (target = new this.__self());

            var items = this.items;
            for(var i in items) {
                if(!items.hasOwnProperty(i)) continue;
                target.items[i] = items[i].clone();
            }

            target.itemsByOrder = this.itemsByOrder.concat();
            target.tech = this.tech;
            target.uniqExpand = this.uniqExpand;

            return target;
        },

        parse: function(deps, ctx, fn) {
            fn || (fn = function(i) { this.add(this.rootItem, 'shouldDeps', i) });

            var _this = this,

                forEachItem = function(type, items, ctx) {
                    items && !isEmptyObject(items) && (Array.isArray(items) ? items : [items]).forEach(function(item) {

                        if(isSimple(item)) {
                            var i = item;
                            (item = {})[type] = i;
                        }
                        item.name && (item[type] = item.name);

                        var depsItem = new DepsItem(item, ctx);

                        fn.call(_this, depsItem); // _this.add(rootItem, 'shouldDeps', depsItem);

                        _this.parse(
                            item.mustDeps,
                            depsItem,
                            function(i) { this.add(depsItem, 'mustDeps', i) });

                        _this.parse(
                            item.shouldDeps,
                            depsItem,
                            function(i) { this.add(depsItem, 'shouldDeps', i) });

                        _this.parse(
                            item.noDeps,
                            depsItem,
                            function(i) { this.remove(depsItem, i) });

                        forEachItem('elem', item.elems, depsItem);

                        var mods = item.mods;
                        if(mods && !Array.isArray(mods)) { // Object
                            var modsArr = [];
                            for(var m in mods) {
                                if(!mods.hasOwnProperty(m)) continue;
                                modsArr.push({ mod: m });
                                var mod = { mod: m }, v = mods[m];
                                Array.isArray(v) ? (mod.vals = v) : (mod.val = v);
                                modsArr.push(mod);
                            }
                            mods = modsArr;
                        }
                        forEachItem('mod', mods, depsItem);

                        forEachItem('val', item.vals, depsItem);

                    });
                };

            forEachItem('block', deps, ctx);

            return this;
        },

        expandByFS: function(tech) {

            this.tech = tech;

            var _this = this,
                depsCount1 = this.getCount(),
                depsCount2;

            return Vow.when(this.expandOnceByFS())
                .then(function again(newDeps) {

                    depsCount2 = newDeps.getCount();
                    if(depsCount1 !== depsCount2) {
                        depsCount1 = depsCount2;
                        return Vow.when(newDeps.expandOnceByFS(), again);
                    }

                    return newDeps.clone(_this);

                });

        },

        expandOnceByFS: function() {

            var newDeps = this.clone(),
                steps = this
                    .filter(function(item) {
                        return !newDeps.uniqExpand.hasOwnProperty(item.buildKey());
                    })
                    .map(function(item) {
                        newDeps.uniqExpand[item.buildKey()] = true;
                        return newDeps.expandItemByFS(item);
                    });

            if (!steps.length) return Vow.fulfill(newDeps);

            return newDeps;
        },

        expandItemByFS: function(item) {

            var _this = this,
                tech = this.tech;

            var files = tech.levels.getFilesByDecl(item.item.block, item.item.elem, item.item.mod, item.item.val)
                .filter(function(file) { return file.suffix == 'deps.js'; });

            files.forEach(function(file) {
                var content = fs.readFileSync(file.fullname, 'utf8');
                try {
                    _this.parse(vm.runInThisContext(content, file.fullname), item);
                } catch(e) {
                    e.message = path + '\n' + e.message;
                    throw e;
                }
            });
        },

        subtract: function(deps) {
            var items1 = this.items,
                items2 = deps.items;

            for(var k in items2)
                if(k && items2.hasOwnProperty(k)) delete items1[k];
            return this;
        },

        intersect: function(deps) {
            var items1 = this.items,
                items2 = deps.items,
                newItems = {};

            for(var k in items2) {
                if((items2.hasOwnProperty(k) && items1.hasOwnProperty(k)) || !k)
                    newItems[k] = items1[k];
            }

            this.items = newItems;

            return this;
        },

        getCount: function() {
            var res = 0,
                items = this.items;

            for(var k in items) items.hasOwnProperty(k) && res++;

            return res;
        },

        forEach: function(fn, uniq, itemsByOrder, ctx) {
            uniq || (uniq = {});
            var _this = this;

            (itemsByOrder || this.items[''].shouldDeps).forEach(function(i) {
                if(i = _this.items[i]) {
                    var key = i.buildKey();
                    if(!uniq.hasOwnProperty(key)) {
                        uniq[key] = true;
                        var newCtx = ctx || i;
                        _this.forEach(fn, uniq, i.mustDeps, newCtx);
                        fn.call(_this, i, newCtx);
                        _this.forEach(fn, uniq, i.shouldDeps, newCtx);
                    }
                }
            })
        },

        map: function(fn) {
            var res = [];
            this.forEach(function(item) { res.push(fn.call(this, item)) });
            return res;
        },

        filter: function(fn) {
            var res = [];
            this.forEach(function(item) { if (fn.call(this, item)) res.push(item) });
            return res;
        },

        serialize: function() {
            var byTech = {};
            this.forEach(function(item, ctx) {
                var t1 = ctx.item.tech || '',
                    t2 = item.item.tech || '',
                    techsByTech = byTech[t1] || (byTech[t1] = {}),
                    i = item.serialize();
                i && (techsByTech[t2] || (techsByTech[t2] = [])).push(i);
            });
            return byTech;
        },

        stringify: function() {
            var res = [],
                deps = this.serialize();

            if(deps['']) {
                res.push('exports.deps = ' + JSON.stringify(deps[''][''], null, 4) + ';\n');
                delete deps[''][''];
            } else {
                res.push('exports.deps = [];\n');
            }

            isEmptyObject(deps) || res.push('exports.depsByTechs = ' + JSON.stringify(deps, null, 4) + ';\n');

            return res.join('');
        },

        getDeps: function() {
            var serializedData = this.serialize();
            return (serializedData && serializedData[''] && serializedData['']['']) || [];
        }

    });

    var DepsItem = exports.DepsItem = inherit({

        __constructor: function(item, ctx) {
            this.shouldDeps = [];
            this.mustDeps = [];
            this.item = {};
            this.extendByCtx({ item: item });
            this.extendByCtx(ctx);
        },

        extendByCtx: function(ctx) {
            if(ctx && (ctx = ctx.item)) {
                var ks = ['tech', 'block', 'elem', 'mod', 'val'],
                    k;

                while(k = ks.shift())
                    if(this.item[k]) break;
                    else ctx[k] && (this.item[k] = ctx[k]);
            }
            return this;
        },

        clone: function() {
            var res = new this.__self({}, this);
            res.shouldDeps = this.shouldDeps.concat();
            res.mustDeps = this.mustDeps.concat();
            this.hasOwnProperty('key') && (res.key = this.key);
            return res;
        },

        extend: function(item) {
            if(!item) return this;
            var ds = ['mustDeps', 'shouldDeps'], d,
                thisDeps, itemDeps;
            while(d = ds.shift()) {
                itemDeps = item[d] || (item[d] = {});
                if(thisDeps = this.item[d]) {
                    for(var k in thisDeps)
                        if(thisDeps.hasOwnProperty(k)) {
                            if(!thisDeps[k].extend) throw 'bla';
                            (itemDeps[k] = thisDeps[k].extend(itemDeps[k]));
                        }
                }
            }
            return item;
        },

        cache: function(cache) {
            var key = this.buildKey();
            return cache[key] = this.extend(cache[key]);
        },

        buildKey: function() {
            if('key' in this) return this.key;

            var i = this.item,
                k = '';

            if(i.block) {
                k += i.block;
                i.elem && (k += '__' + i.elem);
                if(i.mod) {
                    k += '_' + i.mod;
                    i.val && (k += '_' + i.val);
                }
            }
            i.tech && (k += '.' + i.tech);
            return this.key = k;
        },

        buildLevelPath: function(level) {
            return level.getByObj(this.item);
        },

        serialize: function() {
            var res = {},
                ks = ['tech', 'block', 'elem', 'mod', 'val'], k;

            while(k = ks.shift()) this.item[k] && (res[k] = this.item[k]);
            if(res.block) return res;
        }

    });

    function isSimple(o) {
        var t = typeof o;
        return t === 'string' || t === 'number';
    }

    function removeFromArray(arr, o) {
        var i = arr.indexOf(o);
        return i >= 0 ?
            (arr.splice(i, 1), true) :
            false
    }

    function isEmptyObject(obj) {
        for(var i in obj) return false;
        return true;
    }

    return Deps;
})();
