var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'xsl';
    },
    getDestSuffixes: function() {
        return ['xsl'];
    },
    getSourceSuffixes: function() {
        return ['xsl'];
    },
    _getPrependXml: function(sourceFiles, suffix) {
        return '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">';
    },
    _getXmlChunks: function(sourceFiles, suffix) {
        var _this = this;
        return sourceFiles.map(function(file) {
            return '<xsl:import href="' + _this.node.relativePath(file.fullname) + '"/>';
        }).join('\n');
    },
    getBuildResult: function(sourceFiles, suffix) {
        return Vow.all([
            this._getPrependXml(sourceFiles, suffix),
            this._getXmlChunks(sourceFiles, suffix),
            this._getAppendXml(sourceFiles, suffix)
        ]).then(function (results) {
            return results.join('\n');
        });
    },
    _getAppendXml: function(sourceFiles, suffix) {
        var res = [];
        res.push('<xsl:output encoding="UTF-8" method="html" indent="no" media-type="text/html" omit-xml-declaration="yes" />');
        res.push('<xsl:template match="lego:b-page" xmlns:lego="https://lego.yandex-team.ru">');
        res.push('    <xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html></xsl:text>');
        res.push('    <xsl:apply-imports/>');
        res.push('</xsl:template>');
        res.push('</xsl:stylesheet>');
        return res.join('\n');
    }
});