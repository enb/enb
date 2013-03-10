var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    __constructor: function(transformXslFile) {
        this.__base();
        this._transformXslFile = transformXslFile;
    },
    getName: function() {
        return 'xsl-convert2xml';
    },
    getDestSuffixes: function() {
        return ['convert2xml.xsl'];
    },
    getSourceSuffixes: function() {
        return ['convert2xml.xsl'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var res = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
            '<xsl:import href="' + this._transformXslFile + '"/>'
        ];
        res = res.concat(sourceFiles.map(function(file) {
            return '<xsl:import href="' + file.fullname + '"/>';
        }));
        res.push('<xsl:output encoding="utf-8" method="xml" indent="yes"/>');
        res.push('</xsl:stylesheet>');
        return res.join('\n');
    }
});
