/**
 * css
 * ===
 *
 * Склеивает *css*-файлы по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов
 *   (его предоставляет технология `files`). По умолчанию — `?.files`.
 * * *String* **sourceSuffixes** — суффиксы файлов, по которым строится `files`-таргет. По умолчанию — 'css'.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css'));
 * ```
 */
var path = require('path');
var CssPreprocessor = require('../lib/preprocess/css-preprocessor');

/**
 *
 * @type {Tech}
 */
module.exports = require('../lib/build-flow').create()
    .name('css')
    .target('target', '?.css')
    .useFileList('css')
    .builder(function (cssFiles) {
        var node = this.node;
        return this._processCss(cssFiles.map(function (file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n'), node.resolvePath(this._target));
    })
    .methods({
        _processCss: function (data, filename) {
            return this._getCssPreprocessor().preprocess(data, filename);
        },
        _processIncludes: function (data, filename) {
            return this._getCssPreprocessor().preprocessIncludes(data, filename);
        },
        _getCssPreprocessor: function () {
            var _this = this;
            var preprocessCss = new CssPreprocessor();
            preprocessCss.setCssRelativeUrlBuilder(function (url, filename) {
                var urlFilename = path.resolve(path.dirname(filename), url);
                return _this.node.relativePath(urlFilename);
            });
            return preprocessCss;
        }
    })
    .createTech();
