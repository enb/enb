'use strict'

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
 * * *Boolean* **sourcemap** — Построение карт кода (source maps) с информацией об исходных файлах.
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
var vow = require('vow');

var enb = require('../lib/api');
var vfs = enb.asyncFs;
var File = require('enb-source-map/lib/file');

module.exports = enb.buildFlow.create()
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
        var node = this.node;

        return vow.all(sources.map(function (sourceFilename) {
            return vfs.read(sourceFilename, 'utf8');
        })).then(function (results) {
            if (!sourcemap) {
                return results.join(divider);
            }

            var relFileNames = sources.map(node.relativePath, node);

            return joinWithSourceMaps(relFileNames, results, divider, target);
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
