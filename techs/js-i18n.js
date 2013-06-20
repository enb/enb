/**
 * js-i18n
 * =======
 *
 * Берт собранный `js`-файл и добавляет в результат таргет `?.lang.<язык>.js`. Используется с технологией `js` и `i18n-lang-js`
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 * * *String* **jsTarget** — Файл к которому покдлеится локализация. По умолчанию — `?.js`.
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
    .useSourceFilename('jsTarget','?.js')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .justJoinFilesWithComments()
    .createTech();
