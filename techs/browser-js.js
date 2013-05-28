/**
 * browser-js
 * ==========
 */
module.exports = require('../lib/build-flow').create()
    .name('browser-js')
    .target('target', '?.browser.js')
    .useFileList(['vanilla.js', 'js', 'browser.js'])
    .justJoinFilesWithComments()
    .createTech();