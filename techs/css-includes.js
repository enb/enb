/**
 * css-includes
 * ============
 */
var inherit = require('inherit'),
    fs = require('fs');

/**
 * Собирает *css*-файлы по deps'ам инклудами, сохраняет в виде `?.css`. Может пригодиться в паре с ycssjs (как fastcgi-модуль).
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-includes'));
 * ```
 * @type {Tech}
 */
module.exports = require('../lib/build-flow').create()
    .name('css-includes')
    .target('target', '?.css')
    .useFileList('css')
    .builder(function(cssFiles) {
        var node = this.node;
        return cssFiles.map(function(file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n');
    })
    .createTech();
