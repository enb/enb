/**
 * html-from-bemjson-i18n
 * ======================
 *
 * Собирает *html*-файл с помощью *bemjson*, *bemhtml*, *lang.all* и *lang.{lang}*.
 *
 * **Опции**
 *
 * * *String* **bemhtmlTarget** — Исходный BEMHTML-файл. По умолчанию — `?.bemhtml.js`.
 * * *String* **bemjsonTarget** — Исходный BEMJSON-файл. По умолчанию — `?.bemjson.js`.
 * * *String* **langAllTarget** — Исходный langAll-файл. По умолчанию — `?.lang.all.js`.
 * * *String* **langTarget** — Исходный lang-файл. По умолчанию — `?.lang.{lang}.js`.
 *   Если параметр lang не указан, берется первый из объявленных в проекте языков
 * * *String* **destTarget** — Результирующий HTML-файл. По умолчанию — `?.{lang}.html`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/html-from-bemjson-i18n'));
 * ```
 */
var Vow = require('vow');
var vowFs = require('../lib/fs/async-fs');
var inherit = require('inherit');
var requireOrEval = require('../lib/fs/require-or-eval');
var asyncRequire = require('../lib/fs/async-require');

module.exports = inherit(require('../lib/tech/base-tech'), {
    getName: function() {
        return 'html-from-bemjson-i18n';
    },

    configure: function() {
        this._bemhtmlSource = this.node.unmaskTargetName(
            this.getOption('bemhtmlTarget', this.node.getTargetName('bemhtml.js'))
        );

        this._bemjsonSource = this.node.unmaskTargetName(
            this.getOption('bemjsonTarget', this.node.getTargetName('bemjson.js'))
        );

        this._allLangSource = this.node.unmaskTargetName(
            this.getOption('langAllTarget', this.node.getTargetName('lang.all.js'))
        );

        this._langSource = this.node.unmaskTargetName(
            this.getOption(
                'langTarget',
                this.node.getTargetName('lang.' + this.getOption('lang', this.node.getLanguages()[0]) + '.js')
            )
        );

        this._target = this.node.unmaskTargetName(
            this.getOption(
                'destTarget',
                this.node.getTargetName(this.getOption('lang', this.node.getLanguages()[0]) + '.html')
            )
        );
    },

    getTargets: function() {
        return [this.node.unmaskTargetName(this._target)];
    },

    getBuildResult: function(target, bemhtmlFile, bemjson, allLangFile, langFile) {
        var _this = this;
        delete require.cache[bemhtmlFile];
        delete require.cache[allLangFile];
        return Vow.all([
            asyncRequire(bemhtmlFile),
            asyncRequire(allLangFile)
        ]).spread(function(bemhtml, i18n) {
            delete require.cache[langFile];
            return asyncRequire(langFile).then(function(keysets) {
                if (typeof i18n === 'function' && bemhtml.lib) {
                    if (typeof keysets === 'function') {
                        keysets(i18n);
                    }
                    bemhtml.lib.i18n = i18n;
                }
                var global = bemhtml.lib && bemhtml.lib.global;
                if (global) {
                    global.lang = _this.getOption('lang');
                    global.setTld(_this.getOption('lang'));
                }
                return bemhtml.BEMHTML.apply(bemjson);
            });
        });
    },

    isRebuildRequired: function(target) {
        var cache = this.node.getNodeCache(target);
        return cache.needRebuildFile('bemhtml-file', this.node.resolvePath(this._bemhtmlSource)) ||
            cache.needRebuildFile('bemjson-file', this.node.resolvePath(this._bemjsonSource)) ||
            cache.needRebuildFile('allLang-file', this.node.resolvePath(this._allLangSource)) ||
            cache.needRebuildFile('lang-file', this.node.resolvePath(this._langSource)) ||
            cache.needRebuildFile('html-file', this.node.resolvePath(target));
    },

    storeCache: function(target) {
        var cache = this.node.getNodeCache(target);
        cache.cacheFileInfo('bemhtml-file', this.node.resolvePath(this._bemhtmlSource));
        cache.cacheFileInfo('bemjson-file', this.node.resolvePath(this._bemjsonSource));
        cache.cacheFileInfo('allLang-file', this.node.resolvePath(this._allLangSource));
        cache.cacheFileInfo('lang-file', this.node.resolvePath(this._langSource));
        cache.cacheFileInfo('html-file', this.node.resolvePath(target));
    },

    build: function() {
        var _this = this;
        return this.node.requireSources(
            [this._bemhtmlSource, this._bemjsonSource, this._allLangSource, this._langSource]
        ).then(function() {
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
                        return requireOrEval(_this.node.resolvePath(_this._bemjsonSource)).then(function (bemjson) {
                            return Vow.all(targetsToBuild.map(function(target) {
                                return Vow.when(_this.getBuildResult(
                                        target,
                                        _this.node.resolvePath(_this._bemhtmlSource),
                                        bemjson,
                                        _this.node.resolvePath(_this._allLangSource),
                                        _this.node.resolvePath(_this._langSource)
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
