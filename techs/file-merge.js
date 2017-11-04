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
const vow = require('vow');
const File = require('enb-source-map/lib/file');

const enb = require('../lib/api');
const vfs = enb.asyncFs;

module.exports = enb.buildFlow.create()
    .name('file-merge')
    .target('target', '?.target')
    .defineOption('divider', '\n')
    .defineRequiredOption('target')
    .defineRequiredOption('sources')
    .defineOption('sourcemap', false)
    .useSourceListFilenames('sources')
    .builder(function (sources) {
        const divider = this._divider;
        const sourcemap = this._sourcemap;
        const target = this._target;
        const node = this.node;

        return vow.all(sources.map(sourceFilename => vfs.read(sourceFilename, 'utf8')))
            .then(results => {
                if (!sourcemap) {
                    return results.join(divider);
                }

                const relFileNames = sources.map(node.relativePath, node);

                return joinWithSourceMaps(relFileNames, results, divider, target);
            });
    })
    .createTech();

///
function joinWithSourceMaps(fileNames, contents, divider, target) {
    const targetFile = new File(target, {sourceMap: true, comment: 'block'});

    fileNames.forEach((file, i) => {
        targetFile.writeFileContent(file, contents[i]);
        targetFile.write(divider);
    });

    return targetFile.render();
}
