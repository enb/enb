/**
 * pub-js-i18n
 * ===========
 *
 * Технология переехала в пакет `enb-priv-js`.
 */
module.exports = require('../lib/build-flow').create()
    .name('pub-js-i18n')
    .deprecated('enb', 'enb-priv-js')
    .target('target', '?.{lang}.pub.js')
    .defineRequiredOption('lang')
    .useSourceFilename('bemhtmlTarget', '?.bemhtml.js')
    .useSourceFilename('jsTarget', '?.js')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .justJoinFilesWithComments()
    .createTech();
