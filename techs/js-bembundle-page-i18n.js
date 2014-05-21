/**
 * js-bembundle-page-i18n
 * ======================
 *
 * Технология переехала в пакет `enb-bembundle`.
 */

module.exports = require('./js-bembundle-page').buildFlow()
    .name('js-bembundle-page-i18n')
    .deprecated('enb', 'enb-bembundle')
    .defineRequiredOption('lang')
    .useSourceListFilenames('jsChunksTargets', [
        '?.js-chunks.js',
        '?.js-chunks.lang.all.js',
        '?.js-chunks.lang.{lang}.js'
    ])
    .target('target', '?.{lang}.js')
    .createTech();
