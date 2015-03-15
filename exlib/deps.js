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

module.exports.OldDeps = (function () {
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
        __constructor: function (deps) {
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
        add: function (target, depsType, item) {
            var items = this.items;
            var targetKey = target.buildKey();
            var itemKey = item.buildKey();

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
        remove: function (target, item) {
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
        clone: function (target) {
            target || (target = new this.__self());

            var items = this.items;
            for (var i in items) {
                if (!items.hasOwnProperty(i)) {
                    continue;
                }
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
        parse: function (deps, ctx, fn) {
            fn || (fn = function (i) { this.add(this.rootItem, 'shouldDeps', i); });

            var _this = this;

            var forEachItem = function (type, items, ctx) {
                    items && !isEmptyObject(items) && (Array.isArray(items) ? items : [items]).forEach(function (item) {

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
                            function (i) { this.add(depsItem, 'mustDeps', i); });

                        _this.parse(
                            item.shouldDeps,
                            depsItem,
                            function (i) { this.add(depsItem, 'shouldDeps', i); });

                        _this.parse(
                            item.noDeps,
                            depsItem,
                            function (i) { this.remove(depsItem, i); });

                        forEachItem('elem', item.elems, depsItem);

                        var mods = item.mods;
                        if (mods && !Array.isArray(mods)) { // Object
                            var modsArr = [];
                            for (var m in mods) {
                                if (!mods.hasOwnProperty(m)) {
                                    continue;
                                }
                                modsArr.push({ mod: m });
                                var mod = { mod: m };
                                var v = mods[m];
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
        expandByFS: function (tech) {

            this.tech = tech;

            var _this = this;
            var depsCount1 = this.getCount();
            var depsCount2;

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
        expandOnceByFS: function () {

            var newDeps = this.clone();
            var items = this.filter(function (item) {
                return !newDeps.uniqExpand.hasOwnProperty(item.buildKey());
            });

            function keepWorking(item) {
                newDeps.uniqExpand[item.buildKey()] = true;
                return newDeps.expandItemByFS(item).then(function () {
                    if (items.length > 0) {
                        return keepWorking(items.shift());
                    } else {
                        return null;
                    }
                });
            }

            if (items.length > 0) {
                return keepWorking(items.shift()).then(function () {
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
        expandItemByFS: function (item) {

            var _this = this;
            var tech = this.tech;

            var files = tech.levels.getFilesByDecl(item.item.block, item.item.elem, item.item.mod, item.item.val)
                .filter(function (file) {
                    return file.suffix === 'deps.js';
                });

            var promise = Vow.fulfill();

            files.forEach(function (file) {
                promise = promise.then(function () {
                    return vowFs.read(file.fullname, 'utf8').then(function (content) {
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
        subtract: function (deps) {
            var items1 = this.items;
            var items2 = deps.items;

            for (var k in items2) {
                if (k && items2.hasOwnProperty(k)) {
                    delete items1[k];
                }
            }
            return this;
        },

        /**
         * Сохраняет пересечение с другим OldDeps.
         *
         * @param {OldDeps} deps
         * @returns {OldDeps}
         */
        intersect: function (deps) {
            var items1 = this.items;
            var items2 = deps.items;
            var newItems = {};

            for (var k in items2) {
                if ((items2.hasOwnProperty(k) && items1.hasOwnProperty(k)) || !k) {
                    newItems[k] = items1[k];
                }
            }

            this.items = newItems;

            return this;
        },

        /**
         * Возвращает количество зависимостей.
         *
         * @returns {Number}
         */
        getCount: function () {
            var res = 0;
            var items = this.items;

            for (var k in items) {
                items.hasOwnProperty(k) && res++;
            }

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
        forEach: function (fn, uniq, itemsByOrder, ctx) {
            uniq || (uniq = {});
            var _this = this;
            (itemsByOrder || this.items[''].shouldDeps).forEach(function (i) {
                var item = _this.items[i];
                _this._iterateItem(fn, uniq, item, ctx || item, null);
            });
        },

        /**
         * Iterates through item dependencies
         *
         * @param {Function} fn Function accepts `item` argument
         * @param {Object.<string,boolean|String[]>} progress Hash with progress status for items. Possible values:
         *  - undefined: item is not iterated
         *  - true: item is iterated
         *  - String[]: iterating mustDeps for item. Array contains keys for items which depends
         *  on current item and should be re-iterated after it
         * @param {Object} item Current item
         * @param {Object} ctx
         * @param {Object} [mustDepsRoot] First item in series of mustDeps calls, undefined if item is in shouldDeps
         * @returns boolean Do we need to rollback current mustDeps chain
         */
        _iterateItem: function (fn, progress, item, ctx, mustDepsRoot) {
            var _this = this;
            var key = item.buildKey();

            if (progress[key] === true) { return false; } // skip already iterated item
            if (typeof progress[key] === 'object') { // this item mustDeps iteration in progress
                if (!mustDepsRoot) { return false; } // skip if this item in shouldDeps
                if (progress[key].indexOf(mustDepsRoot) < 0) {
                    progress[key].push(mustDepsRoot); // remember to re-iterate current mustDeps chain later, rollback
                }
                return true;
            }

            progress[key] = [];
            var rollback = item.mustDeps.reduce(function (rollback, i) { // iterate mustDeps
                var item = _this.items[i];
                if (item.buildKey() === key) { return rollback; } // skip if item depends on itself
                return _this._iterateItem(fn, progress, item, ctx, mustDepsRoot || key) || rollback;
            }, false);

            // circular mustDeps found, find loop and throw Error
            if (progress[key].indexOf(mustDepsRoot || key) >= 0) { this._throwCircularError(key); }

            if (!rollback) {
                fn.call(this, item, ctx); // iterate item
                var delayedDeps = progress[key];
                progress[key] = true;
                delayedDeps.forEach(function (i) { // iterate items which depends on current item
                    _this._iterateItem(fn, progress, _this.items[i], ctx);
                });
            }

            item.shouldDeps.forEach(function (i) { // iterate shouldDeps
                _this._iterateItem(fn, progress, _this.items[i], ctx);
            });

            if (rollback) { delete progress[key]; }
            return rollback;
        },

        _throwCircularError: function (loopKey) {
            var _this = this;
            function visit(key, stack) {
                var item = _this.items[key];
                if (!item) { return; }
                item.mustDeps.forEach(function (i) {
                    if (i === key) { return; }
                    if (i === loopKey) { throw Error('Circular mustDeps: ' + stack.concat(i).join(' <- ')); }
                    visit(i, stack.concat(i));
                });
            }
            visit(loopKey, [loopKey]);
        },

        /**
         * Вызывает map для набора зависимостей.
         *
         * @param {Function} fn
         * @returns {Array}
         */
        map: function (fn) {
            var res = [];
            this.forEach(function (item) {
                res.push(fn.call(this, item));
            });
            return res;
        },

        /**
         * Фильтрует зависимости, возвращает результат.
         * @param {Function} fn
         * @returns {Array}
         */
        filter: function (fn) {
            var res = [];
            this.forEach(function (item) {
                if (fn.call(this, item)) {
                    res.push(item);
                }
            });
            return res;
        },

        /**
         * Возвращает результат резолвинга.
         *
         * @returns {Object}
         */
        serialize: function () {
            var byTech = {};
            this.forEach(function (item, ctx) {
                var t1 = ctx.item.tech || '';
                var t2 = item.item.tech || '';
                var techsByTech = byTech[t1] || (byTech[t1] = {});
                var i = item.serialize();
                if (i) {
                    (techsByTech[t2] || (techsByTech[t2] = [])).push(i);
                }
            });
            return byTech;
        },

        /**
         * Сериализует в строку.
         *
         * @returns {String}
         */
        stringify: function () {
            var res = [];
            var deps = this.serialize();

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
        getDeps: function () {
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

        __constructor: function (item, ctx) {
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
        extendByCtx: function (ctx) {
            if (ctx && (ctx = ctx.item)) {
                var ks = ['tech', 'block', 'elem', 'mod', 'val'];
                var k;

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
        clone: function () {
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
        extend: function (item) {
            if (!item) {
                return this;
            }
            var ds = ['mustDeps', 'shouldDeps'];
            var d;
            var thisDeps;
            var itemDeps;
            while (d = ds.shift()) {
                itemDeps = item[d] || (item[d] = {});
                if (thisDeps = this.item[d]) {
                    for (var k in thisDeps) {
                        if (thisDeps.hasOwnProperty(k)) {
                            if (!thisDeps[k].extend) {
                                throw 'bla'; // FIXME: WTF?
                            }
                            (itemDeps[k] = thisDeps[k].extend(itemDeps[k]));
                        }
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
        cache: function (cache) {
            var key = this.buildKey();
            return cache[key] = this.extend(cache[key]);
        },

        /**
         * Строит ключ для зависимости.
         *
         * @returns {String}
         */
        buildKey: function () {
            if ('key' in this) {
                return this.key;
            }

            var i = this.item;
            var k = '';

            if (i.block) {
                k += i.block;
                i.elem && (k += '__' + i.elem);
                if (i.mod) {
                    k += '_' + i.mod;
                    i.val && (k += '_' + i.val);
                }
            }
            if (i.tech) {
                k += '.' + i.tech;
            }
            return this.key = k;
        },

        /**
         * Сериализует зависимость в объект.
         *
         * @returns {Object}
         */
        serialize: function () {
            var res = {};
            var ks = ['tech', 'block', 'elem', 'mod', 'val'];
            var k;

            while (k = ks.shift()) {
                if (this.item[k]) {
                    res[k] = this.item[k];
                }
            }
            if (res.block) {
                return res;
            }
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
        for (var i in obj) {
            return false;
        }
        return true;
    }

    return OldDeps;
})();
