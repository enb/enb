/**
 * css-ie
 * ======
 *
 * Склеивает *css* и *ie.css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.ie.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.ie.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-ie'));
 * ```
 */
var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./css').buildFlow()
    .name('css-ie')
    .target('target', '?.ie.css')
    .useFileList(['css', 'ie.css'])
    .createTech();
