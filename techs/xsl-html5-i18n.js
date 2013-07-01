/**
 * xsl-html5-i18n
 * ==============
 *
 * Собирает `?.<язык>.xsl`-файл по deps'ам, добавляя `?.lang.<язык>.xsl`-файл.
 *
 * **Опции**
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.{lang}.xsl`.
 * * *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
 * * *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.
 *
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('xsl-html5-18n'), { lang: '{lang}' } ]);
 * ```
 */
var inherit = require('inherit'),
    fs = require('graceful-fs');

module.exports = require('./xsl-html5').buildFlow()
    .name('xsl-html5-i18n')
    .target('target', '?.{lang}.xsl')
    .defineRequiredOption('lang')
    .useSourceListFilenames('includes', [
        '?.lang.{lang}.xsl'
    ])
    .createTech();
