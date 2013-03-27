var inherit = require('inherit'),
    fs = require('fs'),
    vowFs = require('vow-fs'),
    Vow = require('vow'),
    tanker = require('../exlib/tanker');

module.exports = require('../lib/build-flow').create()
    .name('i18n-lang-js')
    .target('target', '?.lang.{lang}.js')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function(keysetsFilename) {
        delete require.cache[keysetsFilename];
        var keysets = require(keysetsFilename),
            _this = this,
            lang = this._lang,
            res = [];
        Object.keys(keysets).sort().forEach(function(keysetName) {
            res.push(_this.__self.getKeysetBuildResult(keysetName, keysets[keysetName], lang));
        });
        return this.getPrependJs(lang) + res.join('\n\n') + this.getAppendJs(lang);
    })
    .methods({
        getPrependJs: function(lang) {
            return '';
        },
        getAppendJs: function(lang) {
            return lang === 'all' ? '' : "\n\nBEM.I18N.lang('" + lang + "');\n";
        }
    })
    .staticMethods({
        getKeysetBuildResult: function(keysetName, keyset, lang) {
            var res = [];
            if (keysetName === '') {
                res.push(keyset);
            } else {
                res.push("BEM.I18N.decl('" + keysetName + "', {");
                Object.keys(keyset).map(function(key, i, arr) {
                    tanker.xmlToJs(keyset[key], function(js) {
                        res.push('    ' + JSON.stringify(key) + ': ' + js + (i === arr.length - 1 ? '' : ','));
                    });
                });
                res.push('}, {\n"lang": "' + lang + '"\n});');
            }
            return res.join('\n');
        }
    })
    .createTech();