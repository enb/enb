/**
 * xsl
 * ===
 *
 * Собирает `?.xsl` по deps'ам.
 *
 * **Опции**
 *
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — 'xsl'.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.xsl`.
 * * *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
 * * *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/xsl'));
 * ```
 */

module.exports = require('../lib/build-flow').create()
    .name('xsl')
    .target('target', '?.xsl')
    .useFileList('xsl')
    .useSourceListFilenames('imports', [])
    .useSourceListFilenames('includes', [])
    .defineOption('prependXsl', '')
    .defineOption('appendXsl', '')
    .builder(function (sourceFiles, imports, includes) {
        var node = this.node;
        var importFilenames = sourceFiles.map(function (sourceFile) {
                return sourceFile.fullname;
            }).concat(imports);
        return this.getPrependXsl() +
            importFilenames.map(function (filename) {
                return '<xsl:import href="' + node.relativePath(filename) + '"/>';
            }).join('\n') +
            '\n' +
            includes.map(function (filename) {
                return '<xsl:include href="' + node.relativePath(filename) + '"/>';
            }) +
            this.getAppendXsl();
    })
    .methods({
        getPrependXsl: function () {
            return '<?xml version="1.0" encoding="utf-8"?>\n' +
                '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">\n' +
                this._prependXsl;
        },
        getAppendXsl: function () {
            return this._appendXsl + '\n</xsl:stylesheet>';
        }
    })
    .createTech();
