var inherit = require('inherit'),
    fs = require('fs'),
    Vow = require('vow'),
    vowFs = require('vow-fs'),
    path = require('path'),
    crypto = require('crypto'),
    CssPreprocessor = require('../lib/preprocess/css-preprocessor');

module.exports = inherit(require('../lib/tech/chunks'), {
    getName: function() {
        return 'css-chunks';
    },
    getDestSuffixes: function() {
        return ['css-chunks.js'];
    },
    getSourceSuffixes: function() {
        return ['css'];
    },
    _processChunkData: function(sourceFile, data, suffix) {
        var _this = this,
            preprocessCss = new CssPreprocessor();
        preprocessCss.setCssRelativeUrlBuilder(function(url, filename) {
            var urlFilename = path.resolve(path.dirname(filename), url);
            return _this.node.wwwRootPath(urlFilename);
        });
        return preprocessCss.preprocess(data, sourceFile.fullname);
    }
});
