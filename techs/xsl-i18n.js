var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit(require('./xsl'), {
    init: function(node) {
        this.__base(node);
        this._languages = this.getOption('languages', node.getLanguages() || []);
    },
    getName: function() {
        return 'xsl-i18n';
    },
    _getXmlChunks: function(sourceFiles, suffix) {
        var _this = this,
            lang = suffix.split('.')[0],
            langXslTarget = this.node.getTargetName('lang.' + lang + '.xsl'),
            baseMethod = this.__base;
        return this.node.requireSources([langXslTarget]).then(function() {
            return baseMethod.call(_this, sourceFiles, suffix)
                + '\n<xsl:include href="' + langXslTarget + '"/>';
        });
    },
    getDestSuffixes: function() {
        return this._languages.map(function(lang){
            return lang + '.xsl';
        });
    }
});