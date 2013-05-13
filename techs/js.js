/**
 * js
 * ==
 */
module.exports = require('../lib/build-flow').create()
    .name('js')
    .target('target', '?.js')
    .useFileList('js')
    .justJoinFilesWithComments()
    .createTech();
