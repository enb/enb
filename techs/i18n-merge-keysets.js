/**
 * i18n-merge-keysets
 * ==================
 *
 * Технология переехала в пакет `enb-bem-i18n`.
 */
var Vow = require('vow');
var asyncRequire = require('../lib/fs/async-require');

module.exports = require('../lib/build-flow.js').create()
    .name('i18n-merge-keysets')
    .deprecated('enb', 'enb-bem-i18n')
    .defineRequiredOption('lang')
    .useDirList('i18n')
    .target('target', '?.keysets.{lang}.js')
    .builder(function (langKeysetDirs) {
        var lang = this._lang;
        var langJs = lang + '.js';
        var langKeysetFiles = [].concat.apply([], langKeysetDirs.map(function (dir) {
                return dir.files;
            })).filter(function (fileInfo) {
                return fileInfo.name === langJs;
            });

        var result = {};
        return Vow.all(langKeysetFiles.map(function (keysetFile) {
            return asyncRequire(keysetFile.fullname).then(function (keysets) {
                if (lang === 'all') { // XXX: Why the hell they break the pattern?
                    keysets = keysets.all || {};
                }
                Object.keys(keysets).forEach(function (keysetName) {
                    var keyset = keysets[keysetName];
                    result[keysetName] = (result[keysetName] || {});
                    if (typeof keyset !== 'string') {
                        Object.keys(keyset).forEach(function (keyName) {
                            result[keysetName][keyName] = keyset[keyName];
                        });
                    } else {
                        result[keysetName] = keyset;
                    }
                });
            });
        })).then(function () {
            return 'module.exports = ' + JSON.stringify(result) + ';';
        });
    })
    .createTech();
