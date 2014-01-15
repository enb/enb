/**
 * xsl-convert2xml
 * ===============
 *
 * Собирает `?.convert2xml.xsl` по deps'ам.
 *
 * **Опции**
 *
 * * *String* **transformXslFile** — Путь к convert2xml.xsl из lego/tools.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.convert2xml.xsl`.
 * * *String* **prependXsl** — Xsl для вставки в начало документа. По умолчанию пусто.
 * * *String* **appendXsl** — Xsl для вставки в конец документа. По умолчанию пусто.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/xsl-convert2xml'), {
 *   transformXslFile: config.resolvePath('blocks/lego/tools/convert2xml.xsl')
 * } ]);
 * ```
 */
module.exports = require('./xsl').buildFlow()
    .name('xsl-convert2xml')
    .defineRequiredOption('transformXslFile')
    .useFileList('convert2xml.xsl')
    .target('target', '?.convert2xml.xsl')
    .methods({
        getPrependXsl: function () {
            return [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
                '<xsl:import href="' + this.node.relativePath(this._transformXslFile) + '"/>\n'
            ].join('\n') + this._prependXsl;
        },
        getAppendXml: function () {
            return this._appendXsl + '\n<xsl:output encoding="utf-8" method="xml" indent="yes"/>\n</xsl:stylesheet>';
        }
    })
    .createTech();
