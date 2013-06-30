/**
 * i18n-merge-keysets
 * ==================
 *
 * Собирает `?.keysets.<язык>.js`-файлы на основе `*.i18n`-папок для указанных языков.
 *
 * Исходные и конечные таргеты в данный момент не настраиваются (нет запроса).
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.keysets.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   [ require('i18n-merge-keysets'), { lang: 'all' } ],
 *   [ require('i18n-merge-keysets'), { lang: '{lang}' } ]
 * ]);
 * ```
 */
var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    vm = require('vm'),
    asyncRequire = require('../lib/fs/async-require');

module.exports = require('../lib/build-flow.js').create()
    .name('i18n-merge-keysets')
    .defineRequiredOption('lang')
    .useDirList('i18n')
    .target('target', '?.keysets.{lang}.js')
    .builder(function(langKeysetDirs) {
        var lang = this._lang,
            langJs = lang + '.js',
            langKeysetFiles = [].concat.apply([], langKeysetDirs.map(function(dir) {
                return dir.files;
            })).filter(function(fileInfo) {
                return fileInfo.name === langJs;
            });

        var result = {};
        return Vow.all(langKeysetFiles.map(function(keysetFile) {
            return asyncRequire(keysetFile.fullname).then(function(keysets) {
                if (lang === 'all') { // XXX: Why the hell they break the pattern?
                    keysets = keysets.all || {};
                }
                Object.keys(keysets).forEach(function(keysetName) {
                    var keyset = keysets[keysetName];
                    result[keysetName] = (result[keysetName] || {});
                    if (typeof keyset !== 'string') {
                        Object.keys(keyset).forEach(function(keyName) {
                            result[keysetName][keyName] = keyset[keyName];
                        });
                    } else {
                        result[keysetName] = keyset;
                    }
                });
            });
        })).then(function() {
            return 'module.exports = ' + JSON.stringify(result) + ';';
        });
    })
    .createTech();
