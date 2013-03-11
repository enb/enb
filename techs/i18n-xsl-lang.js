var inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit({
    getName: function(options) {
        options = options || {};
        this._languages = options.languages;
    },
    init: function(node) {
        this.node = node;
        this._languages = this._languages || node.getLanguages() || [];
    },
    getTargets: function() {
        var _this = this;
        return this._languages.map(function(lang) {
            return _this.node.getTargetName('lang.' + lang + '.xsl');
        });
    },
    getSourceSuffixes: function() {
        return [];
    },
    build: function() {
        var _this = this,
            sources = this._languages.map(function(lang) {
            _this.node.getTargetName('keysets.' + lang + '.js');
        });
        this.node.requireSources(sources, function() {

        });
    },
    _getPrependXml: function() {
        return '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<xsl:stylesheet xmlns:lego="https://lego.yandex-team.ru" xmlns:i18n="urn:yandex-functions:internationalization" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" extension-element-prefixes="i18n" exclude-result-prefixes="i18n lego">';
    },
    _getAppendXml: function() {
        return '</xsl:stylesheet>';
    }
});