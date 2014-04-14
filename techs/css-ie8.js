/**
 * css-ie8
 * =======
 *
 * Склеивает *css* и *ie8.css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.ie8.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.ie8.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — ['css', 'ie8.css'].
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-ie8'));
 * ```
 * @type {Tech}
 */

module.exports = require('./css').buildFlow()
    .name('css-ie8')
    .target('target', '?.ie8.css')
    .useFileList(['css', 'ie8.css'])
    .createTech();
