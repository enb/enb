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
 * * *String* **jsTarget** — Файл к которому подклеится локализация. Если не указан, происходит сборка по чанкам `?.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/js-i18n'), { lang: '{lang}' } ]);
 * ```
 */

var fs = require('graceful-fs'),
    vowFs = require('vow-fs');

module.exports = require('../lib/build-flow').create()
    .name('js-i18n')
    .target('target', '?.{lang}.js')
    .defineRequiredOption('lang')
    .defineOption('jsTarget')
    .useFileList('js')
    .useSourceText('allLangTarget', '?.lang.all.js')
    .useSourceText('langTarget', '?.lang.{lang}.js')
    .builder(function(jsChunks, allLangTarget, langTarget) {

        var _this = this,
            sourceTexts = [allLangTarget, langTarget],
            jsTarget = this.getOption('jsTarget');

        if (jsTarget) {
            jsTarget = this.node.unmaskTargetName(jsTarget);

            return this.node.requireSources([jsTarget]).then(function() {
                return vowFs.read(_this.node.resolvePath(jsTarget), 'utf8');
            }).then(function(jsTargetSourceText) {
                return [jsTargetSourceText].concat(sourceTexts).join('\n');
            });

        } else {
            return this._joinFilesWithComments(jsChunks).then(function(jsResult) {
                return [jsResult].concat(sourceTexts).join('\n');
            });
        }
    })
    .createTech();