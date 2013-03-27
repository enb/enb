var inherit = require('inherit'),
    Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = require('../lib/build-flow.js').create()
    .name('i18n-merge-keysets')
    .defineRequiredOption('lang')
    .useDirList('i18n')
    .target('target', '?.keysets.{lang}.js')
    .builder(function(langKeysetDirs) {
        var lang = this._lang,
            langJs = lang + '.js',
            langKeysetFiles = [].concat.apply([], langKeysetDirs.map(function(dir) {
                return dir.files;
            })).filter(function(fileInfo) {
                return fileInfo.name == langJs;
            });

        var result = {};
        langKeysetFiles.forEach(function(keysetFile) {
            delete require.cache[keysetFile.fullname];
            var keysets = require(keysetFile.fullname);
            if (lang === 'all') { // XXX: Why the hell they break the pattern?
                keysets = keysets['all'] || {};
            }
            Object.keys(keysets).forEach(function(keysetName) {
                var keyset = keysets[keysetName];
                result[keysetName] = (result[keysetName] || {});
                if (typeof keyset !== 'string') {
                    Object.keys(keyset).forEach(function(keyName) {
                        result[keysetName][keyName] = keyset[keyName];
                    });
                } else {
                    result[keysetName] = keyset;
                }
            });
        });
        return 'module.exports = ' + JSON.stringify(result) + ';';
    })
    .createTech();
