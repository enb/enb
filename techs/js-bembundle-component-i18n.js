var inherit = require('inherit');

module.exports = require('./js-bembundle-component').buildFlow()
    .name('js-bembundle-component-i18n')
    .defineRequiredOption('lang')
    .useSourceListFilenames('jsChunksTargets', [
        '?.js-chunks.js',
        '?.js-chunks.lang.all.js',
        '?.js-chunks.lang.{lang}.js'
    ])
    .target('target', '?.bembundle.{lang}.js')
    .createTech();
