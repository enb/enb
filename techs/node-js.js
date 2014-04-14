/**
 * node-js
 * =======
 *
 * Склеивает *vanilla.js* и *node.js*-файлы по deps'ам, сохраняет в виде `?.node.js`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.node.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет.
 *    По умолчанию — ['vanilla.js', 'node.js'].
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/node-js'));
 * ```
 */
module.exports = require('../lib/build-flow').create()
    .name('node-js')
    .target('target', '?.node.js')
    .useFileList(['vanilla.js', 'node.js'])
    .justJoinFilesWithComments()
    .createTech();
