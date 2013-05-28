/**
 * node-js
 * =======
 */
module.exports = require('../lib/build-flow').create()
    .name('node-js')
    .target('target', '?.node.js')
    .useFileList(['vanilla.js', 'node.js'])
    .justJoinFilesWithComments()
    .createTech();