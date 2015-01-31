/**
 * i18n-lang-js
 * ============
 *
 * Технология переехала в пакет `enb-bem-i18n`.
 */
var tanker = require('../exlib/tanker');
var dropRequireCache = require('../lib/fs/drop-require-cache');

module.exports = require('../lib/build-flow').create()
    .name('i18n-lang-js')
    .deprecated('enb', 'enb-bem-i18n')
    .target('target', '?.lang.{lang}.js')
    .defineRequiredOption('lang')
    .useSourceFilename('keysetsTarget', '?.keysets.{lang}.js')
    .builder(function (keysetsFilename) {
        dropRequireCache(require, keysetsFilename);
        var keysets = require(keysetsFilename);
        var _this = this;
        var lang = this._lang;
        var res = [];
        Object.keys(keysets).sort().forEach(function (keysetName) {
            res.push(_this.__self.getKeysetBuildResult(keysetName, keysets[keysetName], lang));
        });
        return this.getPrependJs(lang) + res.join('\n\n') + this.getAppendJs(lang);
    })
    .methods({
        getPrependJs: function () {
            return '';
        },
        getAppendJs: function (lang) {
            return lang === 'all' ? '' : '\n\nBEM.I18N.lang(\'' + lang + '\');\n';
        }
    })
    .staticMethods({
        getKeysetBuildResult: function (keysetName, keyset, lang) {
            var res = [];
            if (keysetName === '') {
                res.push(keyset);
            } else {
                res.push('BEM.I18N.decl(\'' + keysetName + '\', {');
                Object.keys(keyset).map(function (key, i, arr) {
                    tanker.xmlToJs(keyset[key], function (js) {
                        res.push('    ' + JSON.stringify(key) + ': ' + js + (i === arr.length - 1 ? '' : ','));
                    });
                });
                res.push('}, {\n"lang": "' + lang + '"\n});');
            }
            return res.join('\n');
        }
    })
    .createTech();
