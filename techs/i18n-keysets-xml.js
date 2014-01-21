/**
 * i18n-keysets-xml
 * ================
 *
 * Собирает `?.keysets.<язык>.xml`-файлы на основе `?.keysets.<язык>.js`-файлов.
 *
 * Используется для локализации xml-страниц.
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
 * nodeConfig.addTech([ require('i18n-keysets-xml'), { lang: '{lang}' } ]);
 * ```
 */
var domjs = require('dom-js');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = require('../lib/build-flow').create()
    .name('i18n-keysets-xml')
    .target('target', '?.keysets.{lang}.xml')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
        dropRequireCache(require, keysetsFilename);
        var lang = this._lang;
        var keysets = require(keysetsFilename);
        var res = [];
        Object.keys(keysets).sort().map(function (keysetName) {
            var keyset = keysets[keysetName];
            res.push('<keyset id="' + keysetName + '">');
            Object.keys(keyset).map(function (key) {
                var value = keyset[key];
                var dom = new domjs.DomJS();
                try {
                    dom.parse('<root>' + value + '</root>', function () {});
                } catch (e) {
                    value = domjs.escape(value);
                }
                res.push('<key id="' + key + '">');
                res.push('<value>' + value + '</value>');
                res.push('</key>');
            });
            res.push('</keyset>');
        });
        return this.getPrependXml(lang) + res.join('\n') + this.getAppendXml(lang);

    })
    .methods({
        getPrependXml: function () {
            return '<?xml version="1.0" encoding="utf-8"?>\n' +
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" ' +
                'xmlns:i18n="urn:yandex-functions:internationalization">\n';
        },
        getAppendXml: function () {
            return '\n</tanker>';
        }
    })
    .createTech();
