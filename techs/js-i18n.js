/**
 * js-i18n
 * =======
 *
 * Собирает или берет готовый `js`-файл и добавляет в результат таргет `?.lang.<язык>.js`. Используется с технологией `i18n-lang-js`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 * * *String* **jsTarget** — Файл к которому подклеится локализация. Если не указан, происходит сборка по суффиксам из `filesTarget`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — Суффикс файлов для сборки. По умолчанию `js`
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/js-i18n'), { lang: '{lang}' } ]);
 * nodeConfig.addTech([ require('enb/techs/js-i18n'), { lang: '{lang}' }, jsTarget: '?.temp.js' ]);
 * ```
 */

var fs = require('graceful-fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = require('../lib/build-flow').create()
    .name('js-i18n')
    .target('target', '?.{lang}.js')
    .defineRequiredOption('lang')
    .defineOption('jsTarget')
    .defineOption('filesTarget')
    .defineOption('sourceSuffixes')
    .useSourceText('allLangTarget', '?.lang.all.js')
    .useSourceText('langTarget', '?.lang.{lang}.js')
    .needRebuild(function(cache) {

        var _this = this,
            jsTarget = this.getOption('jsTarget');

        if (jsTarget) {
            return cache.needRebuildFile('jsTarget-file', _this.node.resolvePath(_this.node.unmaskTargetName(jsTarget)));
        } else {
            var filesTarget = this.getOption('filesTarget', '?.files');
            return cache.needRebuildFile('filesTarget-file', _this.node.resolvePath(_this.node.unmaskTargetName(filesTarget)));
        }
    })
    .saveCache(function(cache) {

        var _this = this,
            jsTarget = this.getOption('jsTarget');

        if (jsTarget) {
            cache.cacheFileInfo('jsTarget-file', _this.node.resolvePath(_this.node.unmaskTargetName(jsTarget)));
        } else {
            var filesTarget = this.getOption('filesTarget', '?.files');
            cache.cacheFileInfo('filesTarget-file', _this.node.resolvePath(_this.node.unmaskTargetName(filesTarget)));
        }
    })
    .builder(function(allLangTarget, langTarget) {

        var _this = this,
            promise,
            sourceTexts = [allLangTarget, langTarget],
            jsTarget = this.getOption('jsTarget'),
            filesTarget = this.getOption('filesTarget', '?.files'),
            sourceSuffixes = this.getOption('sourceSuffixes', 'js');

        if (jsTarget) {
            jsTarget = this.node.unmaskTargetName(jsTarget);
            promise = this.node.requireSources([jsTarget]).then(function() {
                return vowFs.read(_this.node.resolvePath(jsTarget), 'utf8');
            });
        } else {
            filesTarget = this.node.unmaskTargetName(filesTarget);
            promise = this.node.requireSources([filesTarget]).spread(function(files) {
                var jsChunks = files.bySuffix[sourceSuffixes];
                return _this._joinFilesWithComments(jsChunks);
            });

        }

        return promise.then(function(jsTargetSourceText) {
            return [jsTargetSourceText].concat(sourceTexts).join('\n');
        });
    })
    .createTech();