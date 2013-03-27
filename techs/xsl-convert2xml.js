module.exports = require('./xsl').buildFlow()
    .name('xsl-convert2xml')
    .defineRequiredOption('transformXslFile')
    .useFileList('convert2xml.xsl')
    .target('target', '?.convert2xml.xsl')
    .methods({
        getPrependXsl: function() {
            return [
                '<?xml version="1.0" encoding="utf-8"?>',
                '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
                '<xsl:import href="' + this.node.relativePath(this._transformXslFile) + '"/>\n'
            ].join('\n') + this._prependXsl;
        },
        getAppendXml: function() {
            return this._appendXsl + '\n<xsl:output encoding="utf-8" method="xml" indent="yes"/>\n</xsl:stylesheet>';
        }
    })
    .createTech();
