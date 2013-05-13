/**
 * js-chunks
 * =========
 */
module.exports = require('../lib/tech/chunks').buildFlow()
    .name('js-chunks')
    .target('target', '?.js-chunks.js')
    .useFileList('js')
    .createTech();
