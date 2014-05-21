/**
 * xsl
 * ===
 *
 * Технология переехала в пакет `enb-lego-xml`.
 */

module.exports = require('../lib/build-flow').create()
    .name('xsl')
    .deprecated('enb', 'enb-lego-xml')
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
