/**
 * i18n-lang-js-chunks
 * ===================
 *
 * Собирает `?.js-chunks.lang.<язык>.js`-файлы на основе `?.keysets.<язык>.js`-файлов.
 *
 * Используется для локализации в JS с помощью BEM.I18N при сборке bembundle.
 *
 * Исходные и конечные таргеты в данный момент не настраиваются (нет запроса).
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.js-chunks.lang.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   [ require('i18n-lang-js-chunks'), { lang: 'all' } ],
 *   [ require('i18n-lang-js-chunks'), { lang: '{lang}' } ],
 * ]);
 * ```
 */
var Vow = require('vow');
var dropRequireCache = require('../lib/fs/drop-require-cache');

var I18NLangJs = require('./i18n-lang-js');

module.exports = require('../lib/tech/chunks').buildFlow()
    .name('i18n-lang-js-chunks')
    .defineRequiredOption('lang')
    .target('target', '?.js-chunks.lang.{lang}.js')
    .unuseFileList()
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
        dropRequireCache(require, keysetsFilename);
        var keysets = require(keysetsFilename);
        var _this = this;
        var filename = this.node.resolvePath(this._target);
        var lang = this._lang;
        return Vow.fulfill().then(function () {
            return Vow.all(Object.keys(keysets).sort().map(function (keysetName) {
                return _this.processChunk(
                    filename,
                    I18NLangJs.getKeysetBuildResult(keysetName, keysets[keysetName], lang)
                );
            })).then(function (chunks) {
                return 'module.exports = ' + JSON.stringify(chunks) + ';';
            });
        });
    })
    .createTech();
