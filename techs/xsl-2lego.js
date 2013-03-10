var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return '2lego.xsl';
    },
    getDestSuffixes: function() {
        return ['2lego.xsl'];
    },
    getSourceSuffixes: function() {
        return ['2lego.xsl'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var res = [
            '<?xml version="1.0" encoding="utf-8"?>',
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">'
        ];
        res = res.concat(sourceFiles.map(function(file) {
            return '<xsl:import href="' + file.fullname + '"/>';
        }));
        res.push('</xsl:stylesheet>');
        return res.join('\n');
    }
});