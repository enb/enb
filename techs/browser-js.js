/**
 * browser-js
 * ==========
 *
 * Склеивает *vanilla.js*, *js* и *browser.js*-файлы по deps'ам, сохраняет в виде `?.browser.js`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.browser.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/browser-js'));
 * ```
 */
module.exports = require('../lib/build-flow').create()
    .name('browser-js')
    .target('target', '?.browser.js')
    .useFileList(['vanilla.js', 'js', 'browser.js'])
    .justJoinFilesWithComments()
    .createTech();