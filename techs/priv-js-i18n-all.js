/**
 * priv-js-i18n-all
 * =================
 *
 * Собирает *all.priv.js*-файл из *priv.js* и массива языков.
 * **Опции**
 *
 * * *Array* **langTargets** — Массив языков. По умолчанию — `[]`.
 * * *String* **privJsTarget** — Исходный priv.js-файл. По умолчанию — `?.priv.js`.
 * * *String* **target** — Результирующий priv.js-файл. По умолчанию — `?.all.priv.js`.
 *
 * **Пример**
 *
 * ```javascript
 *  [ require('enb/techs/priv-js-i18n-all'), {
 *      langTargets: ['all'].concat(config.getLanguages()).map(function(lang) {return '?.lang.'+lang+'.js'}).concat(['?.priv.js'])
 *  } ]
 * ```
 */


var Vow = require('vow'),
    vowFs = require('vow-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('priv-js-i18n-all')
    .target('target', '?.all.priv.js')
    .useSourceListFilenames('langTargets', [])
    .useSourceText('privJsTarget', '?.priv.js')
    .builder(function(langFilenames, privJs) {
        return Vow.all(
            langFilenames.map(function(filename) {
                return vowFs.read(filename);
            })
        ).then(function(langResults) {
            return langResults.join('\n') + privJs;
        });
    })
    .createTech();