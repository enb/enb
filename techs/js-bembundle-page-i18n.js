/**
 * js-bembundle-page-i18n
 * ======================
 *
 * Собирает страничный `?.<язык>.js`-файл из `?.css-chunks.js`,  `?.js-chunks.lang.<язык>.js` и `?.js-chunks.js`.
 *
 * Используется вместе с `deps-subtract`, `deps-provider`, `js-chunks`, `i18n-lang-js-chunks`, `css-chunks` для построения догружаемой части функционала сайта.
 *
 * **Опции**
 *
 * * *String* **cssChunksTargets** — Имена `css-chunks.js`-таргетов, которые предоставляют CSS-чанки. По умолчанию — `[ '?.css-chunks.js' ]`.
 * * *String* **jsChunksTargets** — Имена `js-chunks.js`-таргетов, которые предоставляют JS-чанки. По умолчанию — `[ '?.js-chunks.js' ]`.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.bembundle.{lang}.js`.
 * * *String* **lang** — Язык, для которого небходимо собрать файл.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   ...
 *   require('enb/techs/css-chunks'),
 *   require('enb/techs/js-chunks'),
 *   [ require('enb/techs/i18n-merge-keysets'), { lang: 'all' } ],
 *   [ require('enb/techs/i18n-merge-keysets'), { lang: '{lang}' } ],
 *   [ require('enb/techs/i18n-lang-js-chunks'), { lang: 'all' } ],
 *   [ require('enb/techs/i18n-lang-js-chunks'), { lang: '{lang}' } ],
 *   [ require('enb/techs/js-bembundle-page-i18n'), { lang: '{lang}' } ]
 * ]);
 * ```
 */
var inherit = require('inherit');

module.exports = require('./js-bembundle-page').buildFlow()
    .name('js-bembundle-page-i18n')
    .defineRequiredOption('lang')
    .useSourceListFilenames('jsChunksTargets', [
        '?.js-chunks.js',
        '?.js-chunks.lang.all.js',
        '?.js-chunks.lang.{lang}.js'
    ])
    .target('target', '?.{lang}.js')
    .createTech();
