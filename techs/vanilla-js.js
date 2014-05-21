/**
 * vanilla-js
 * ==========
 *
 * Технология переехала в пакет `enb-diverse-js`.
 */
module.exports = require('../lib/build-flow').create()
    .name('vanilla-js')
    .deprecated('enb', 'enb-diverse-js')
    .target('target', '?.vanilla.js')
    .useFileList('vanilla.js')
    .justJoinFilesWithComments()
    .createTech();
