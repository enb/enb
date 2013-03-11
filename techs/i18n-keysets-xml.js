var inherit = require('inherit'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    domjs = require('dom-js');

// TODO: кэширование
module.exports = inherit({
    __constructor: function(options) {
        options = options || {};
        this._languages = options.languages;
    },
    getName: function() {
        return 'i18n-keysets-xml';
    },
    init: function(node) {
        this.node = node;
        this._languages = this._languages || node.getLanguages() || [];
    },
    getTargets: function() {
        var _this = this;
        return this._languages.map(function(lang) {
            return _this.node.getTargetName('keysets.' + lang + '.xml');
        });
    },
    getSourceSuffixes: function() {
        return [];
    },
    build: function() {
        var _this = this,
            sources = this._languages.map(function(lang) {
                return _this.node.getTargetName('keysets.' + lang + '.js');
            });
        return this.node.requireSources(sources).then(function() {
            _this._languages.map(function(lang) {
                var target = _this.node.getTargetName('keysets.' + lang + '.xml'),
                    keysets = require(_this.node.resolvePath(_this.node.getTargetName('keysets.' + lang + '.js'))),
                    res = [];
                Object.keys(keysets).sort().map(function(keysetName) {
                    var keyset = keysets[keysetName];
                    res.push('<keyset id="' + keysetName + '">');
                    Object.keys(keyset).map(function(key) {
                        var value = keyset[key], dom = new domjs.DomJS();
                        try {
                            dom.parse('<root>' + value + '</root>', function() {});
                        } catch(e) {
                            value = domjs.escape(value);
                        }
                        res.push('<key id="' + key + '">');
                        res.push('<value>' + value + '</value>');
                        res.push('</key>');
                    });
                    res.push('</keyset>');
                });
                var xml = _this._getPrependXml(lang) + res.join('\n') + _this._getAppendXml(lang);
                return vowFs.write(
                        _this.node.resolvePath(target),
                        xml,
                        "utf8"
                    ).then(function() {
                        _this.node.resolveTarget(target);
                    });
            });
        });
    },
    _getPrependXml: function(lang) {
        return '<?xml version="1.0" encoding="utf-8"?>\n' +
            '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:i18n="urn:yandex-functions:internationalization">\n';
    },
    _getAppendXml: function(lang) {
        return '\n</tanker>';
    }
});