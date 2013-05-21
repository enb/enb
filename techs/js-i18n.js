/**
 * js-i18n
 * =======
 *
 * Собирает `js`-файл по deps'ам и добавляет в результат таргет `?.lang.<язык>.js`. Используется с технологией `i18n-lang-js`.
 *
 * **Опции**
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/js-i18n'), { lang: '{lang}' } ]);
 * ```
 */
module.exports = require('../lib/build-flow').create()
    .name('js-i18n')
    .target('target', '?.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList('js')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .justJoinFilesWithComments()
    .createTech();
