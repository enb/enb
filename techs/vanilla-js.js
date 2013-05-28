/**
 * vanilla-js
 * ==========
 */
module.exports = require('../lib/build-flow').create()
    .name('vanilla-js')
    .target('target', '?.vanilla.js')
    .useFileList('vanilla.js')
    .justJoinFilesWithComments()
    .createTech();