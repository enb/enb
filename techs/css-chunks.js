/**
 * css-chunks
 * ==========
 *
 * Технология переехала в пакет `enb-bembundle`.
 */
var path = require('path');
var CssPreprocessor = require('../lib/preprocess/css-preprocessor');

module.exports = require('../lib/tech/chunks').buildFlow()
    .name('css-chunks')
    .deprecated('enb', 'enb-bembundle')
    .target('target', '?.css-chunks.js')
    .useFileList('css')
    .methods({
        processChunkData: function (sourceFilename, data) {
            var _this = this;
            var preprocessCss = new CssPreprocessor();
            preprocessCss.setCssRelativeUrlBuilder(function (url, filename) {
                var urlFilename = path.resolve(path.dirname(filename), url);
                return _this.node.wwwRootPath(urlFilename);
            });
            return preprocessCss.preprocess(data, sourceFilename);
        }
    })
    .createTech();
