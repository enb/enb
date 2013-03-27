module.exports = require('../lib/build-flow').create()
    .name('js-i18n')
    .target('target', '?.{lang}.js')
    .defineRequiredOption('lang')
    .useSourceFilename('allLangTarget', '?.lang.all.js')
    .useSourceFilename('langTarget', '?.lang.{lang}.js')
    .useFileList('js')
    .justJoinFilesWithComments()
    .createTech();
