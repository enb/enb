/**
 * js-bembundle-page
 * =================
 *
 * Технология переехала в пакет `enb-bembundle`.
 */
var Vow = require('vow');

module.exports = require('./js-bembundle-component').buildFlow()
    .name('js-bembundle-page')
    .deprecated('enb', 'enb-bembundle')
    .target('target', '?.js')
    .methods({
        buildBundle: function (jsChunks, cssChunks) {
            var _this = this;
            return Vow.when(this.buildJsBody(jsChunks)).then(function (jsBody) {
                return [
                    _this.__self.getOnceFunctionDecl(),
                    '\n',
                    jsBody
                ].concat(cssChunks.map(function (chunk) {
                    return _this.__self.getExistingChunkDecl(chunk.hash);
                })).join('');
            });
        }
    })
    .createTech();
