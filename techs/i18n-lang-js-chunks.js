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
var inherit = require('inherit'),
    fs = require('graceful-fs'),
    vowFs = require('../lib/fs/async-fs'),
    Vow = require('vow'),
    crypto = require('crypto');

var I18NLangJs = require('./i18n-lang-js');

module.exports = require('../lib/tech/chunks').buildFlow()
    .name('i18n-lang-js-chunks')
    .defineRequiredOption('lang')
    .target('target', '?.js-chunks.lang.{lang}.js')
    .unuseFileList()
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function(keysetsFilename) {
        delete require.cache[keysetsFilename];
        var keysets = require(keysetsFilename),
            _this = this,
            filename = this.node.resolvePath(this._target),
            lang = this._lang;
        return Vow.fulfill().then(function() {
            return Vow.all(Object.keys(keysets).sort().map(function(keysetName) {
                return _this.processChunk(
                    filename,
                    I18NLangJs.getKeysetBuildResult(keysetName, keysets[keysetName], lang)
                );
            })).then(function(chunks) {
                return 'module.exports = ' + JSON.stringify(chunks) + ';';
            });
        });
    })
    .createTech();
