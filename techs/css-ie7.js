/**
 * css-ie7
 * =======
 *
 * Склеивает *css* и *ie7.css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.ie7.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.ie7.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — ['css', 'ie7.css'].
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-ie7'));
 * ```
 */

module.exports = require('./css').buildFlow()
    .name('css-ie7')
    .target('target', '?.ie7.css')
    .useFileList(['css', 'ie7.css'])
    .createTech();
