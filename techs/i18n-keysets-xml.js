var inherit = require('inherit'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    domjs = require('dom-js'),
    Vow = require('vow');

module.exports = require('../lib/build-flow').create()
    .name('i18n-keysets-xml')
    .target('target', '?.keysets.{lang}.xml')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function(keysetsFilename) {
        delete require.cache[keysetsFilename];
        var lang = this._lang,
            keysets = require(keysetsFilename),
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
        return this.getPrependXml(lang) + res.join('\n') + this.getAppendXml(lang);

    })
    .methods({
        getPrependXml: function(lang) {
            return '<?xml version="1.0" encoding="utf-8"?>\n' +
                '<tanker xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:i18n="urn:yandex-functions:internationalization">\n';
        },
        getAppendXml: function(lang) {
            return '\n</tanker>';
        }
    })
    .createTech();