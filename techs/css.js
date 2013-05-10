var inherit = require('inherit'),
    fs = require('fs'),
    path = require('path'),
    CssPreprocessor = require('../lib/preprocess/css-preprocessor');

module.exports = require('../lib/build-flow').create()
    .name('css')
    .target('target', '?.css')
    .useFileList('css')
    .builder(function(cssFiles) {
        var node = this.node;
        return this._processCss(cssFiles.map(function(file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n'), node.resolvePath(this._target));
    })
    .methods({
        _processCss: function(data, filename) {
            return this._getCssPreprocessor().preprocess(data, filename);
        },
        _processIncludes: function(data, filename) {
            return this._getCssPreprocessor().preprocessIncludes(data, filename);
        },
        _getCssPreprocessor: function() {
            var _this = this,
                preprocessCss = new CssPreprocessor();
            preprocessCss.setCssRelativeUrlBuilder(function(url, filename) {
                var urlFilename = path.resolve(path.dirname(filename), url);
                return _this.node.relativePath(urlFilename);
            });
            return preprocessCss;
        }
    })
    .createTech();
