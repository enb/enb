/**
 * priv-js-i18n
 * ============
 *
 * Технология переехала в пакет `enb-priv-js`.
 */
module.exports = require('../lib/build-flow').create()
    .name('priv-js-i18n')
    .deprecated('enb', 'enb-priv-js')
    .target('target', '?.{lang}.priv.js')
    .defineRequiredOption('lang')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .useSourceFilename('privJsTarget', '?.priv.js')
    .justJoinFilesWithComments()
    .createTech();
