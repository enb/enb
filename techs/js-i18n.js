/**
 * js-i18n
 * =======
 *
 * Технология переехала в пакет `enb-priv-js`.
 */
module.exports = require('../lib/build-flow').create()
    .name('js-i18n')
    .target('target', '?.{lang}.js')
    .defineRequiredOption('lang')
    .useFileList('js')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .justJoinFilesWithComments()
    .createTech();
