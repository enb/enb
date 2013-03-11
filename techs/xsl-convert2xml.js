var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./xsl'), {
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
    _getPrependXml: function() {
        return [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">',
            '<xsl:import href="' + this.node.relativePath(this._transformXslFile) + '"/>'
        ].join('\n');
    },
    _getAppendXml: function() {
        return '<xsl:output encoding="utf-8" method="xml" indent="yes"/>\n</xsl:stylesheet>';
    }
});
