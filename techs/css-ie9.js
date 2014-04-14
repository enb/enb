/**
 * css-ie9
 * =======
 *
 * Склеивает *css* и *ie9.css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.ie9.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.ie9.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — ['css', 'ie9.css'].
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-ie9'));
 * ```
 */

module.exports = require('./css').buildFlow()
    .name('css-ie9')
    .target('target', '?.ie9.css')
    .useFileList(['css', 'ie9.css'])
    .createTech();
