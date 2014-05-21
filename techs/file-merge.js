/**
 * file-merge
 * ==========
 *
 * Склеивает набор файлов в один.
 *
 * **Опции**
 *
 * * *String[]* **sources** — Список исходных таргетов. Обязательная опция.
 * * *String* **target** — Результирующий таргет. Обязательная опция.
 * * *String* **divider** — Строка для склеивания файлов. По умолчанию — "\n".
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/file-merge'), {
 *     sources: ['?.bemhtml', '?.pre.js']
 *     target: '?.js'
 * } ]);
 * ```
 */
var Vow = require('vow');
var vowFs = require('../lib/fs/async-fs');

module.exports = require('../lib/build-flow').create()
    .name('file-merge')
    .target('target', '?.target')
    .defineOption('divider', '\n')
    .defineRequiredOption('target')
    .defineRequiredOption('sources')
    .useSourceListFilenames('sources')
    .builder(function (sources) {
        var divider = this._divider;
        return Vow.all(sources.map(function (sourceFilename) {
            return vowFs.read(sourceFilename, 'utf8');
        })).then(function (results) {
            return results.join(divider);
        });
    })
    .createTech();
