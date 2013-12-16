/**
 * node-js
 * =======
 *
 * Собирает *vanilla.js* и *node.js*-файлы по deps'ам с помощью `require`, сохраняет в виде `?.node.js`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.node.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
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
    .builder(function(sourceFiles) {
        var node = this.node;
        return sourceFiles.map(function(file) {
            return "require('" + node.relativePath(file.fullname) + "');";
        }).join('\n');
    })
    .createTech();
