/**
 * js-bembundle-page
 * =================
 *
 * Собирает страничный `?.js`-файл из `?.css-chunks.js` и `?.js-chunks.js`.
 *
 * Результирующий файл готов к догрузке кода из бандлов
 * (JS и CSS, приходящий из бандлов, повторно не выполняется на странице).
 *
 * **Опции**
 *
 * * *String* **cssChunksTargets** — Имена `css-chunks.js`-таргетов, которые предоставляют CSS-чанки.
 *   По умолчанию — `[ '?.css-chunks.js' ]`.
 * * *String* **jsChunksTargets** — Имена `js-chunks.js`-таргетов, которые предоставляют JS-чанки.
 *   По умолчанию — `[ '?.js-chunks.js' ]`.
 * * *String* **target** — Результирующий таргет. По умолчанию — `?.js`.
 *
 * **Пример**
 *
 * ```javascript
 * nodeConfig.addTechs([
 *   ...
 *   require('enb/techs/css-chunks'),
 *   require('enb/techs/js-chunks'),
 *   require('enb/techs/js-bundle-page')
 * ]);
 * ```
 */
var Vow = require('vow');

module.exports = require('./js-bembundle-component').buildFlow()
    .name('js-bembundle-page')
    .target('target', '?.js')
    .methods({
        buildBundle: function(jsChunks, cssChunks) {
            var _this = this;
            return Vow.when(this.buildJsBody(jsChunks)).then(function(jsBody) {
                return [
                    _this.__self.getOnceFunctionDecl(),
                    '\n',
                    jsBody
                ].concat(cssChunks.map(function(chunk){
                    return _this.__self.getExistingChunkDecl(chunk.hash);
                })).join('');
            });
        }
    })
    .createTech();
