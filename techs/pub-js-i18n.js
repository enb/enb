/**
 * pub-js-i18n
 * ===========
 *
 * Собирает *{lang}.pub.js*-файл из *js*, языковых файлов и *bemhtml*.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий `priv.js`-файл. По умолчанию — `?.all.priv.js`.
 * * *String* **jsTarget** — Исходный `js`-файл. По умолчанию — `?.js`.
 * * *String* **lang** — Язык. Обязательная опция.
 * * *Array* **langTarget** — `lang.js`-файл конкретного языка. Например, `?.lang.ru.js`. По умолчанию — `?.lang.{lang}.js`.
 * * *Array* **allLangTarget** — `lang.all.js`-файл. По умолчанию — `?.lang.all.js`.
 * * *Array* **bemhtmlTarget** — `bemhtml.js`-файл. По умолчанию — `?.bemhtml.js`.
 *
 * **Пример**
 *
 * ```javascript
 *  [ require('enb/techs/pub-js-i18n'), {
 *      jsTarget: '?.js',
 *      target: '?.pub.js'
 *  } ]
 * ```
 */
module.exports = require('../lib/build-flow').create()
    .name('pub-js-i18n')
    .target('target', '?.{lang}.pub.js')
    .defineRequiredOption('lang')
    .useSourceFilename('jsTarget', '?.js')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .useSourceFilename('bemhtmlTarget', '?.bemhtml.js')
    .justJoinFilesWithComments()
    .createTech();
