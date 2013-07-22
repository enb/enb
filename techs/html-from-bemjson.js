/**
 * html-from-bemjson
 * =================
 *
 * Собирает *html*-файл с помощью *bemjson* и *bemhtml*.
 *
 * **Опции**
 *
 * * *String* **bemhtmlTarget** — Исходный BEMHTML-файл. По умолчанию — `?.bemhtml.js`.
 * * *String* **bemjsonTarget** — Исходный BEMJSON-файл. По умолчанию — `?.bemjson.js`.
 * * *String* **destTarget** — Результирующий HTML-файл. По умолчанию — `?.html`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/html-from-bemjson'));
 * ```
 */
var fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('../lib/fs/async-fs'),
    inherit = require('inherit'),
    vm = require('vm'),
    path = require('path'),
    asyncRequire = require('../lib/fs/async-require');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'html-from-bemjson';
    },

    configure: function() {
        this._bemhtmlSource = this.node.unmaskTargetName(
            this.getOption('bemhtmlTarget', this.node.getTargetName('bemhtml.js')));
        this._bemjsonSource = this.node.unmaskTargetName(
            this.getOption('bemjsonTarget', this.node.getTargetName('bemjson.js')));
        this._target = this.node.unmaskTargetName(
            this.getOption('destTarget', this.node.getTargetName('html')));
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    getBuildResult: function(target, bemhtmlFile, bemjson) {
        delete require.cache[bemhtmlFile];
        return asyncRequire(bemhtmlFile).then(function(bemhtml) {
            return bemhtml.BEMHTML.apply(bemjson);
        });
    },

    isRebuildRequired: function(target) {
        var cache = this.node.getNodeCache(target);
        return cache.needRebuildFile('bemhtml-file', this.node.resolvePath(this._bemhtmlSource)) ||
            cache.needRebuildFile('bemjson-file', this.node.resolvePath(this._bemjsonSource)) ||
            cache.needRebuildFile('html-file', this.node.resolvePath(target));
    },

    storeCache: function(target) {
        var cache = this.node.getNodeCache(target);
        cache.cacheFileInfo('bemhtml-file', this.node.resolvePath(this._bemhtmlSource));
        cache.cacheFileInfo('bemjson-file', this.node.resolvePath(this._bemjsonSource));
        cache.cacheFileInfo('html-file', this.node.resolvePath(target));
    },

    build: function() {
        var _this = this;
        return this.node.requireSources([this._bemhtmlSource, this._bemjsonSource]).then(function() {
            return Vow.when(_this.getTargets()).then(function(targets) {
                var targetsToBuild = [];
                return Vow.when(targets.map(function(target) {
                    return Vow.when(_this.isRebuildRequired(target)).then(function(rebuildRequired) {
                        if (!rebuildRequired) {
                            _this.node.isValidTarget(target);
                            _this.node.resolveTarget(target);
                        } else {
                            targetsToBuild.push(target);
                        }
                    });
                })).then(function() {
                    if (targetsToBuild.length) {
                        return vowFs.read(_this.node.resolvePath(_this._bemjsonSource), 'utf8')
                            .then(function(bemjson) {
                                try {
                                    bemjson = vm.runInThisContext(bemjson);
                                } catch (e) {
                                    throw new Error(
                                        'Syntax error at "' +
                                        _this.node.resolvePath(_this._bemjsonSource) +
                                        '": ' + e.message
                                    );
                                }
                                return Vow.all(targetsToBuild.map(function(target) {
                                    return Vow.when(_this.getBuildResult(
                                            target,
                                            _this.node.resolvePath(_this._bemhtmlSource),
                                            bemjson
                                        )).then(function(res) {
                                            return vowFs.write(_this.node.resolvePath(target), res, 'utf8');
                                        }).then(function() {
                                            _this.node.resolveTarget(target);
                                            _this.storeCache(target);
                                        });
                                }));
                            });
                    }
                    return null;
                });
            });
        });
    }
});
