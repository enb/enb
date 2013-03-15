var fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    inherit = require('inherit'),
    vm = require('vm'),
    path = require('path');

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

    getBuildResult: function(target, bemhtml, bemjson) {
        vm.runInThisContext(bemhtml);
        // magic
        return BEMHTML.apply(bemjson);
    },

    isRebuildRequired: function(target) {
        var cache = this.node.getNodeCache(target);
        return cache.needRebuildFile('bemhtml-file', this.node.resolvePath(this._bemhtmlSource))
            || cache.needRebuildFile('bemjson-file', this.node.resolvePath(this._bemjsonSource))
            || cache.needRebuildFile('html-file', this.node.resolvePath(target));
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
                            _this.node.resolveTarget(target);
                            _this.node.getLogger().isValid(target);
                        } else {
                            targetsToBuild.push(target);
                        }
                    });
                })).then(function() {
                    if (targetsToBuild.length) {
                        return Vow.all([
                                vowFs.read(_this.node.resolvePath(_this._bemhtmlSource), 'utf8'),
                                vowFs.read(_this.node.resolvePath(_this._bemjsonSource), 'utf8')
                            ]).spread(function(bemhtml, bemjson) {
                                bemjson = vm.runInThisContext(bemjson);
                                return Vow.all(targetsToBuild.map(function(target) {
                                    return Vow.when(_this.getBuildResult(target, bemhtml, bemjson)).then(function(res) {
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

//
//var argsLen = process.argv.length - 1,
//
//    UTIL = require('util'),
//    VM = require('vm'),
//    BEM = require('bem'),
//    Q = BEM.require('qq'),
//    bemUtil = require('bem/lib/util'),
//
//    LEGO_ROOT = path.resolve(path.join(__dirname, '../')),
//
//    bemhtmlFile = process.argv[2],
//    bemjsonFile = process.argv[3] || bemhtmlFile.replace(/bemhtml.js$/, 'bemjson.js'),
//    i18nFiles = bemjsonFile.replace(/bemjson.js$/, 'i18n'),
//    // учитываем что обязательные паметры только первые два
//    htmlFile = argsLen > 3 ? process.argv[argsLen > 5 ? argsLen-1 : argsLen] : bemjsonFile.replace(/bemjson.js$/, 'html'),
//
//    defaultLang = 'ru',
//    lang = argsLen > 5 ? process.argv[argsLen] : defaultLang,
//
//    bemhtml = bemUtil.readFile(bemhtmlFile),
//    bemjson = require('./util').loadJSON(bemjsonFile),
//    i18nLib = bemUtil.readFile(path.join(LEGO_ROOT, 'blocks-common/i-bem/i18n/lib/i18n.js')),
//    i18n = getLocalization(lang);
//
//Q.all([bemhtml, bemjson, i18nLib, i18n])
//    .then(function(res) {
//        return buildHtml.apply(null, [htmlFile].concat(res));
//    })
//    .end();
//
//
//function getLocalization(lang) {
//    function langFile(l) {
//        var file = path.join(i18nFiles, [l, 'js'].join('.'));
//        return path.existsSync(file) && file;
//    }
//    var file = langFile(lang) || langFile(defaultLang);
//    if(!file) return '';
//    return vowFs.read(file);
//}
//
//function buildHtml(resultHtmlPath, bemhtml, bemjson, i18nLib, i18n) {
//    vm.runInThisContext([i18nLib, i18n, bemhtml].join('\n'));
//    return vowFs
//        .write(resultHtmlPath, BEMHTML.apply(bemjson))
//        .then(function() {
//            console.log(resultHtmlPath);
//        });
//}
