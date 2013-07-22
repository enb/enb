/**
 * --- (C) Original BEM Tools, modified for compatibility.
 *
 * Инструментарий для раскрытия deps'ов.
 * Заимствованный.
 */

var inherit = require('inherit');
var vowFs = require('../lib/fs/async-fs');
var vm = require('vm');
var Vow = require('vow');

module.exports.OldDeps = (function() {
    /**
     * Класс, раскрывающий зависимости. Взят из bem-tools.
     *
     * @name OldDeps
     */
    var OldDeps = inherit({

        /**
         * Конструктор.
         * Принимает блоки из bemdecl.
         *
         * @param {Array} deps
         */
        __constructor: function(deps) {
            this.items = {};
            this.itemsByOrder = [];
            this.uniqExpand = {};

            // Force adding of root item to this.items
            var rootItem = this.rootItem = new OldDepsItem({});
            this.items[rootItem.buildKey()] = rootItem;

            deps && this.parse(deps);
        },

        /**
         * Добавляет зависимость в коллекцию.
         *
         * @param {OldDepsItem} target
         * @param {String} depsType shouldDeps/mustDeps
         * @param {OldDepsItem} item
         */
        add: function(target, depsType, item) {
            var items = this.items,
                targetKey = target.buildKey(),
                itemKey = item.buildKey();

            if (!items[itemKey]) {
                items[itemKey] = item;
                this.itemsByOrder.push(itemKey);
            }

            (items[targetKey] || (items[targetKey] = target))[depsType].push(itemKey);
        },

        /**
         * Удаляет зависимость из коллекции.
         *
         * @param {OldDepsItem} target
         * @param {OldDepsItem} item
         */
        remove: function(target, item) {
            target = this.items[target.buildKey()];
            var itemKey = item.buildKey();
            removeFromArray(target.shouldDeps, itemKey);
            removeFromArray(target.mustDeps, itemKey);
        },

        /**
         * Клонирует резолвер зависимостей.
         *
         * @param {OldDeps} [target]
         * @returns {OldDeps}
         */
        clone: function(target) {
            target || (target = new this.__self());

            var items = this.items;
            for (var i in items) {
                if (!items.hasOwnProperty(i)) continue;
                target.items[i] = items[i].clone();
            }

            target.itemsByOrder = this.itemsByOrder.concat();
            target.tech = this.tech;
            target.uniqExpand = this.uniqExpand;

            return target;
        },

        /**
         * Разбирает bemdecl.
         *
         * @param {Array} deps
         * @param {Object} [ctx]
         * @param {Function} [fn]
         * @returns {OldDeps}
         */
        parse: function(deps, ctx, fn) {
            fn || (fn = function(i) { this.add(this.rootItem, 'shouldDeps', i); });

            var _this = this,

                forEachItem = function(type, items, ctx) {
                    items && !isEmptyObject(items) && (Array.isArray(items) ? items : [items]).forEach(function(item) {

                        if (isSimple(item)) {
                            var i = item;
                            (item = {})[type] = i;
                        }
                        item.name && (item[type] = item.name);

                        var depsItem = new OldDepsItem(item, ctx);

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
                        if (mods && !Array.isArray(mods)) { // Object
                            var modsArr = [];
                            for (var m in mods) {
                                if (!mods.hasOwnProperty(m)) continue;
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

        /**
         * Раскрывает зависимости, используя deps.js-файлы.
         *
         * @param {Object} tech
         * @returns {Promise}
         */
        expandByFS: function(tech) {

            this.tech = tech;

            var _this = this,
                depsCount1 = this.getCount(),
                depsCount2;

            return Vow.when(this.expandOnceByFS())
                .then(function again(newDeps) {

                    depsCount2 = newDeps.getCount();
                    if (depsCount1 !== depsCount2) {
                        depsCount1 = depsCount2;
                        return Vow.when(newDeps.expandOnceByFS(), again);
                    }

                    return newDeps.clone(_this);

                });

        },

        /**
         * Раскрывает зависимости, используя deps.js-файлы без повторений.
         *
         * @returns {Promise}
         */
        expandOnceByFS: function() {

            var newDeps = this.clone();
            var items = this.filter(function(item) {
                return !newDeps.uniqExpand.hasOwnProperty(item.buildKey());
            });

            function keepWorking(item) {
                newDeps.uniqExpand[item.buildKey()] = true;
                return newDeps.expandItemByFS(item).then(function() {
                    if (items.length > 0) {
                        return keepWorking(items.shift());
                    } else {
                        return null;
                    }
                });
            }

            if (items.length > 0) {
                return keepWorking(items.shift()).then(function() {
                    return newDeps;
                });
            } else {
                return Vow.fulfill(newDeps);
            }
        },

        /**
         * Раскрывает одну зависимость, используя deps.js-файлы.
         *
         * @param {OldDepsItem} item
         * @returns {Promise}
         */
        expandItemByFS: function(item) {

            var _this = this,
                tech = this.tech;

            var files = tech.levels.getFilesByDecl(item.item.block, item.item.elem, item.item.mod, item.item.val)
                .filter(function(file) { return file.suffix === 'deps.js'; });

            var promise = Vow.fulfill();

            files.forEach(function(file) {
                promise = promise.then(function() {
                    return vowFs.read(file.fullname, 'utf8').then(function(content) {
                        try {
                            _this.parse(vm.runInThisContext(content, file.fullname), item);
                        } catch (e) {
                            throw new Error('Syntax error in file "' + file.fullname + '": ' + e.message);
                        }
                    });
                });
            });

            return promise;
        },

        /**
         * Вычитает зависимости из переданного OldDeps.
         *
         * @param {OldDeps} deps
         * @returns {OldDeps}
         */
        subtract: function(deps) {
            var items1 = this.items,
                items2 = deps.items;

            for (var k in items2)
                if (k && items2.hasOwnProperty(k)) delete items1[k];
            return this;
        },

        /**
         * Сохраняет пересечение с другим OldDeps.
         *
         * @param {OldDeps} deps
         * @returns {OldDeps}
         */
        intersect: function(deps) {
            var items1 = this.items,
                items2 = deps.items,
                newItems = {};

            for (var k in items2) {
                if ((items2.hasOwnProperty(k) && items1.hasOwnProperty(k)) || !k)
                    newItems[k] = items1[k];
            }

            this.items = newItems;

            return this;
        },

        /**
         * Возвращает количество зависимостей.
         *
         * @returns {Number}
         */
        getCount: function() {
            var res = 0,
                items = this.items;

            for (var k in items) items.hasOwnProperty(k) && res++;

            return res;
        },

        /**
         * Итерирует по набору зависимостей.
         *
         * @param {Function} fn
         * @param {Object} [uniq]
         * @param {Array} [itemsByOrder]
         * @param {Object} [ctx]
         */
        forEach: function(fn, uniq, itemsByOrder, ctx) {
            uniq || (uniq = {});
            var _this = this;

            (itemsByOrder || this.items[''].shouldDeps).forEach(function(i) {
                if (i = _this.items[i]) {
                    var key = i.buildKey();
                    if (!uniq.hasOwnProperty(key)) {
                        uniq[key] = true;
                        var newCtx = ctx || i;
                        _this.forEach(fn, uniq, i.mustDeps, newCtx);
                        fn.call(_this, i, newCtx);
                        _this.forEach(fn, uniq, i.shouldDeps, newCtx);
                    }
                }
            })
        },

        /**
         * Вызывает map для набора зависимостей.
         *
         * @param {Function} fn
         * @returns {Array}
         */
        map: function(fn) {
            var res = [];
            this.forEach(function(item) { res.push(fn.call(this, item)); });
            return res;
        },

        /**
         * Фильтрует зависимости, возвращает результат.
         * @param {Function} fn
         * @returns {Array}
         */
        filter: function(fn) {
            var res = [];
            this.forEach(function(item) { if (fn.call(this, item)) res.push(item); });
            return res;
        },

        /**
         * Возвращает результат резолвинга.
         *
         * @returns {Object}
         */
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

        /**
         * Сериализует в строку.
         *
         * @returns {String}
         */
        stringify: function() {
            var res = [],
                deps = this.serialize();

            if (deps['']) {
                res.push('exports.deps = ' + JSON.stringify(deps[''][''], null, 4) + ';\n');
                delete deps[''][''];
            } else {
                res.push('exports.deps = [];\n');
            }

            isEmptyObject(deps) || res.push('exports.depsByTechs = ' + JSON.stringify(deps, null, 4) + ';\n');

            return res.join('');
        },

        /**
         * Возвращает результат раскрытия зависимостей.
         *
         * @returns {Object|*|*|Array}
         */
        getDeps: function() {
            var serializedData = this.serialize();
            return (serializedData && serializedData[''] && serializedData['']['']) || [];
        }

    });

    /**
     * Элемент зависимостей.
     *
     * @name OldDepsItem
     */
    var OldDepsItem = inherit({

        __constructor: function(item, ctx) {
            this.shouldDeps = [];
            this.mustDeps = [];
            this.item = {};
            this.extendByCtx({ item: item });
            this.extendByCtx(ctx);
        },

        /**
         * Раскрывает зависимости.
         *
         * @param {Object} ctx
         * @returns {OldDepsItem}
         */
        extendByCtx: function(ctx) {
            if (ctx && (ctx = ctx.item)) {
                var ks = ['tech', 'block', 'elem', 'mod', 'val'],
                    k;

                while (k = ks.shift()) {
                    if (this.item[k]) {
                        break;
                    } else {
                        ctx[k] && (this.item[k] = ctx[k]);
                    }
                }
            }
            return this;
        },

        /**
         * Возвращает копию.
         *
         * @returns {OldDepsItem}
         */
        clone: function() {
            var res = new this.__self({}, this);
            res.shouldDeps = this.shouldDeps.concat();
            res.mustDeps = this.mustDeps.concat();
            this.hasOwnProperty('key') && (res.key = this.key);
            return res;
        },

        /**
         * Расширяет зависимость.
         *
         * @param {OldDepsItem} item
         * @returns {OldDepsItem}
         */
        extend: function(item) {
            if (!item) return this;
            var ds = ['mustDeps', 'shouldDeps'], d,
                thisDeps, itemDeps;
            while (d = ds.shift()) {
                itemDeps = item[d] || (item[d] = {});
                if (thisDeps = this.item[d]) {
                    for (var k in thisDeps)
                        if (thisDeps.hasOwnProperty(k)) {
                            if (!thisDeps[k].extend) throw 'bla';
                            (itemDeps[k] = thisDeps[k].extend(itemDeps[k]));
                        }
                }
            }
            return item;
        },

        /**
         * Записывает зависимость в кэш по ключу.
         *
         * @param {Object} cache
         * @returns {OldDepsItem}
         */
        cache: function(cache) {
            var key = this.buildKey();
            return cache[key] = this.extend(cache[key]);
        },

        /**
         * Строит ключ для зависимости.
         *
         * @returns {String}
         */
        buildKey: function() {
            if ('key' in this) return this.key;

            var i = this.item,
                k = '';

            if (i.block) {
                k += i.block;
                i.elem && (k += '__' + i.elem);
                if (i.mod) {
                    k += '_' + i.mod;
                    i.val && (k += '_' + i.val);
                }
            }
            i.tech && (k += '.' + i.tech);
            return this.key = k;
        },

        /**
         * Сериализует зависимость в объект.
         *
         * @returns {Object}
         */
        serialize: function() {
            var res = {},
                ks = ['tech', 'block', 'elem', 'mod', 'val'], k;

            while (k = ks.shift()) this.item[k] && (res[k] = this.item[k]);
            if (res.block) return res;
        }

    });

    exports.DepsItem = OldDepsItem;

    /**
     * Возвращает true при String/Number.
     * @param {*} value
     * @returns {Boolean}
     */
    function isSimple(value) {
        var t = typeof value;
        return t === 'string' || t === 'number';
    }

    /**
     * Хэлпер для удаления значений из массива.
     * Возвращает true в случае успеха.
     *
     * @param {Array} arr
     * @param {*} value
     * @returns {Boolean}
     */
    function removeFromArray(arr, value) {
        var i = arr.indexOf(value);
        if (i >= 0) {
            arr.splice(i, 1);
            return true;
        } else {
            return false;
        }
    }

    /**
     * Возвращает true, если переданный объект пуст.
     * @param {Object} obj
     * @returns {Boolean}
     */
    function isEmptyObject(obj) {
        for (var i in obj) return false;
        return true;
    }

    return OldDeps;
})();
