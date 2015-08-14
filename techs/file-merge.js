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
var File = require('enb-source-map/lib/file');

module.exports = require('../lib/build-flow').create()
    .name('file-merge')
    .target('target', '?.target')
    .defineOption('divider', '\n')
    .defineRequiredOption('target')
    .defineRequiredOption('sources')
    .defineOption('sourcemap', false)
    .useSourceListFilenames('sources')
    .builder(function (sources) {
        var divider = this._divider;
        var sourcemap = this._sourcemap;
        var target = this._target;

        return Vow.all(sources.map(function (sourceFilename) {
            return vowFs.read(sourceFilename, 'utf8');
        })).then(function (results) {
            if (!sourcemap) {
                return results.join(divider);
            }

            return joinWithSourceMaps(sources, results, divider, target);
        });
    })
    .createTech();

///
function joinWithSourceMaps(fileNames, contents, divider, target) {
    var targetFile = new File(target, {sourceMap: true, comment: 'block'});

    fileNames.forEach(function (file, i) {
        targetFile.writeFileContent(file, contents[i]);
        targetFile.write(divider);
    });

    return targetFile.render();
}
