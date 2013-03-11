var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./xsl'), {
    getName: function() {
        return 'xsl-2lego';
    },
    getDestSuffixes: function() {
        return ['2lego.xsl'];
    },
    getSourceSuffixes: function() {
        return ['2lego.xsl'];
    },
    _getAppendXml: function(sourceFiles, suffix) {
        return '</xsl:stylesheet>';
    }
});