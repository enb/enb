/**
 * priv-js-i18n-all
 * =================
 *
 * Технология переехала в пакет `enb-priv-js`.
 */
var Vow = require('vow');
var vowFs = require('../lib/fs/async-fs');

module.exports = require('../lib/build-flow').create()
    .name('priv-js-i18n-all')
    .deprecated('enb', 'enb-priv-js')
    .target('target', '?.all.priv.js')
    .useSourceListFilenames('langTargets', [])
    .useSourceText('privJsTarget', '?.priv.js')
    .builder(function (langFilenames, privJs) {
        return Vow.all(
            langFilenames.map(function (filename) {
                return vowFs.read(filename);
            })
        ).then(function (langResults) {
            return langResults.join('\n') + privJs;
        });
    })
    .createTech();
