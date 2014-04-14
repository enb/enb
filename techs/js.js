/**
 * js
 * ==
 *
 * Склеивает *js*-файлы по deps'ам, сохраняет в виде `?.js`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — 'js'.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/js'));
 * ```
 */
module.exports = require('../lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .useFileList('js')
    .justJoinFilesWithComments()
    .createTech();
