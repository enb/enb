/**
 * css-ie-includes
 * ===============
 *
 * Собирает *css* и *ie.css*-файлы по deps'ам инклудами, сохраняет в виде `?.ie.css`.
 * Может пригодиться в паре с ycssjs (как fastcgi-модуль).
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.ie.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — ['css', 'ie.css'].
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-ie-includes'));
 * ```
 */

module.exports = require('./css-includes').buildFlow()
    .name('css-ie-includes')
    .target('target', '?.ie.css')
    .useFileList(['css', 'ie.css'])
    .createTech();
