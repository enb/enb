/**
 * priv-js-i18n
 * ============
 */
module.exports = require('../lib/build-flow').create()
    .name('priv-js-i18n')
    .target('target', '?.{lang}.priv.js')
    .defineRequiredOption('lang')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .useSourceFilename('privJsTarget', '?.priv.js')
    .justJoinFilesWithComments()
    .createTech();
