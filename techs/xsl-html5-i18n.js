/**
 * xsl-html5-i18n
 * ==============
 */
var inherit = require('inherit'),
    fs = require('fs');

module.exports = require('./xsl-html5').buildFlow()
    .name('xsl-html5-i18n')
    .target('target', '?.{lang}.xsl')
    .defineRequiredOption('lang')
    .useSourceListFilenames('includes', [
        '?.lang.{lang}.xsl'
    ])
    .createTech();
