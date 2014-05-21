/**
 * browser-js
 * ==========
 *
 * Технология переехала в пакет `enb-diverse-js`.
 */
module.exports = require('../lib/build-flow').create()
    .name('browser-js')
    .deprecated('enb', 'enb-diverse-js')
    .target('target', '?.browser.js')
    .useFileList(['vanilla.js', 'js', 'browser.js'])
    .justJoinFilesWithComments()
    .createTech();
