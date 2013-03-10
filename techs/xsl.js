var inherit = require('inherit'),
    fs = require('fs');

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
    getBuildResult: function(sourceFiles, suffix) {
        var res = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">'
        ];
        res = res.concat(sourceFiles.map(function(file) {
            return '<xsl:import href="' + file.fullname + '"/>';
        }));
        res.push('<xsl:output encoding="UTF-8" method="html" indent="no" media-type="text/html" omit-xml-declaration="yes" />')
        res.push('<xsl:template match="lego:b-page" xmlns:lego="https://lego.yandex-team.ru">');
        res.push('    <xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html></xsl:text>');
        res.push('    <xsl:apply-imports/>');
        res.push('</xsl:template>');
        res.push('</xsl:stylesheet>');
        return res.join('\n');
    }
});