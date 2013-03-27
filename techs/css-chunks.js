var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    crypto = require('crypto'),
    CssPreprocessor = require('../lib/preprocess/css-preprocessor');

module.exports = require('../lib/tech/chunks').buildFlow()
    .name('css-chunks')
    .target('target', '?.css-chunks.js')
    .useFileList('css')
    .methods({
        processChunkData: function(sourceFilename, data) {
            var _this = this,
                preprocessCss = new CssPreprocessor();
            preprocessCss.setCssRelativeUrlBuilder(function(url, filename) {
                var urlFilename = path.resolve(path.dirname(filename), url);
                return _this.node.wwwRootPath(urlFilename);
            });
            return preprocessCss.preprocess(data, sourceFilename);
        }
    })
    .createTech();
