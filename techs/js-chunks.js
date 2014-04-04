/**
 * js-chunks
 * =========
 *
 * Из *js*-файлов по deps'ам, собирает `js-chunks.js`-файл.
 *
 * `js-chunks.js`-файлы нужны для создания bembundle-файлов или bembundle-страниц.
 * Технология bembundle активно используется в bem-tools для выделения из проекта догружаемых
 * кусков функционала и стилей (js/css).
 *
 * **Опции**
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — 'js'.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.js-chunks.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/js-chunks'));
 * ```
 */
module.exports = require('../lib/tech/chunks').buildFlow()
    .name('js-chunks')
    .target('target', '?.js-chunks.js')
    .useFileList('js')
    .createTech();
