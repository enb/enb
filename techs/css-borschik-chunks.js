/**
 * css-borschik-chunks
 * ===================
 *
 * Из *css*-файлов по deps'ам, собирает `css-chunks.js`-файл, обрабатывая инклуды, ссылки.
 * Умеет минифицировать и фризить.
 *
 * `css-chunks.js`-файлы нужны для создания bembundle-файлов или bembundle-страниц.
 * Технология bembundle активно используется в bem-tools для выделения
 * из проекта догружаемых кусков функционала и стилей (js/css).
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css-chunks.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *Boolean* **minify** — Минифицировать ли в процессе обработки. По умолчанию — `true`.
 * * *Boolean* **freeze** — Использовать ли фризинг в процессе обработки. По умолчанию — `false`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech([ require('enb/techs/css-borschik-chunks'), {
 *   minify: true,
 *   freeze: true
 * } ]);
 * ```
 */
var vowFs = require('../lib/fs/async-fs');
var BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

module.exports = require('./css-chunks').buildFlow()
    .name('css-borschik-chunks')
    .defineOption('freeze', false)
    .defineOption('minify', false)
    .methods({
        processChunkData: function (sourceFilename) {
            var _this = this;
            var target = this._target;
            return this.node.createTmpFileForTarget(target).then(function (tmpFile) {
                return (new BorschikPreprocessor())
                    .preprocessFile(sourceFilename, tmpFile, _this._freeze, _this._minify).then(function () {
                        return vowFs.read(tmpFile, 'utf8').then(function (data) {
                            vowFs.remove(tmpFile);
                            return data;
                        });
                    });
            });
        }
    })
    .createTech();
