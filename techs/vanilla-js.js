/**
 * vanilla-js
 * ==========
 *
 * Склеивает *vanilla.js*-файлы по deps'ам, сохраняет в виде `?.vanilla.js`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.vanilla.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/vanilla-js'));
 * ```
 */
module.exports = require('../lib/build-flow').create()
    .name('vanilla-js')
    .target('target', '?.vanilla.js')
    .useFileList('vanilla.js')
    .justJoinFilesWithComments()
    .createTech();