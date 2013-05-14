/**
 * priv-js
 * =======
 *
 * Собирает `?.priv.js` по deps'ам, обрабатывая Борщиком, добавляет BEMHTML в начало.
 *
 * Имя результирующего файла в данный момент не настраивается (нет запросов на эту функцию).
 *
 * **Опции**
 *
 * * *String* **bemhtmlTarget** — Имя `bemhtml.js`-таргета. По умолчанию — `?.bemhtml.js`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/priv-js'));
 * ```
 */
var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    BorschikPreprocessor = require('../lib/preprocess/borschik-preprocessor');

module.exports = require('../lib/build-flow').create()
    .name('priv-js')
    .target('target', '?.priv.js')
    .useFileList('priv.js')
    .useSourceText('bemhtmlTarget', '?.bemhtml.js')
    .builder(function(sourceFiles, bemhtml) {
        var _this = this,
            target = this._target,
            jsBorschikPreprocessor = new BorschikPreprocessor();
        return Vow.all(sourceFiles.map(function(file) {
            return _this.node.createTmpFileForTarget(target).then(function(tmpfile) {
                return jsBorschikPreprocessor.preprocessFile(file.fullname, tmpfile, false, false).then(function() {
                    return vowFs.read(tmpfile, 'utf8').then(function(data) {
                        vowFs.remove(tmpfile);
                        return data;
                    });
                });
            });
        })).then(function(res) {
            return bemhtml + '\n' + res.join('\n');
        });
    })
    .createTech();
