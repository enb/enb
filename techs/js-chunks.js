/**
 * js-chunks
 * =========
 *
 * Технология переехала в пакет `enb-bembundle`.
 */
module.exports = require('../lib/tech/chunks').buildFlow()
    .name('js-chunks')
    .deprecated('enb', 'enb-bembundle')
    .target('target', '?.js-chunks.js')
    .useFileList('js')
    .createTech();
