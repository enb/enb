/**
 * css-stylus
 * ==========
 *
 * Собирает *css*-файлы вместе со *styl*-файлами по deps'ам, обрабатывает инклуды и ссылки, сохраняет в виде `?.css`.
 *
 * **Опции**
 *
 * * *String* **target** — Результирующий таргет. По умолчанию `?.css`.
 * * *String* **filesTarget** — files-таргет, на основе которого получается список исходных файлов (его предоставляет технология `files`). По умолчанию — `?.files`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTech(require('enb/techs/css-stylus'));
 * ```
 */
var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    stylus = require('stylus');

module.exports = require('./css').buildFlow()
    .name('css-stylus')
    .useFileList(['css', 'styl'])
    .builder(function (sourceFiles) {
        var _this = this,
            promise = Vow.promise();

        var css = sourceFiles.map(function(file) {
            return '@import "' + file.fullname + '";';
        }).join('\n');

        var targetName = _this._target;
        stylus(css)
            .define('url', function(url){
                return new stylus.nodes.Literal('url(' + _this._resolveCssUrl(url.val, url.filename) + ')');
            })
            .set('filename', _this.node.resolvePath(targetName))
            .render(function(err, css) {
                if (err) promise.reject(err);
                promise.fulfill(css);
            });

        return promise.then(function(css) {
            return _this._processIncludes(css, _this.node.resolvePath(targetName));
        });
    })
    .createTech();
