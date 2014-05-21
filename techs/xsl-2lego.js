/**
 * xsl-2lego
 * =========
 *
 * Технология переехала в пакет `enb-lego-xml`.
 */
module.exports = require('./xsl').buildFlow()
    .name('xsl-2lego')
    .deprecated('enb', 'enb-lego-xml')
    .useFileList('2lego.xsl')
    .target('target', '?.2lego.xsl')
    .createTech();
