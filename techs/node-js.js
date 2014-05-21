/**
 * node-js
 * =======
 *
 * Технология переехала в пакет `enb-diverse-js`.
 */
module.exports = require('../lib/build-flow').create()
    .name('node-js')
    .deprecated('enb', 'enb-diverse-js')
    .target('target', '?.node.js')
    .useFileList(['vanilla.js', 'node.js'])
    .justJoinFilesWithComments()
    .createTech();
