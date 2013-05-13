/**
 * js-bembundle-page-i18n
 * ======================
 */
var inherit = require('inherit');

module.exports = require('./js-bembundle-page').buildFlow()
    .name('js-bembundle-page-i18n')
    .defineRequiredOption('lang')
    .useSourceListFilenames('jsChunksTargets', [
        '?.js-chunks.js',
        '?.js-chunks.lang.all.js',
        '?.js-chunks.lang.{lang}.js'
    ])
    .target('target', '?.{lang}.js')
    .createTech();
