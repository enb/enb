/**
 * xsl-2lego
 * =========
 */
module.exports = require('./xsl').buildFlow()
    .name('xsl-2lego')
    .useFileList('2lego.xsl')
    .target('target', '?.2lego.xsl')
    .createTech();
