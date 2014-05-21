/**
 * xsl-html5-i18n
 * ==============
 *
 * Технология переехала в пакет `enb-lego-xml`.
 */

module.exports = require('./xsl-html5').buildFlow()
    .name('xsl-html5-i18n')
    .deprecated('enb', 'enb-lego-xml')
    .target('target', '?.{lang}.xsl')
    .defineRequiredOption('lang')
    .useSourceListFilenames('includes', [
        '?.lang.{lang}.xsl'
    ])
    .createTech();
