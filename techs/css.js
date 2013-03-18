var inherit = require('inherit'),
    fs = require('fs'),
    path = require('path'),
    CssPreprocessor = require('../lib/preprocess/css-preprocessor');
module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'css';
    },
    getDestSuffixes: function() {
        return ['css'];
    },
    getSourceSuffixes: function() {
        return ['css'];
    },
    getBuildResult: function(sourceFiles, suffix) {
        var node = this.node;
        return this._processCss(sourceFiles.map(function(file) {
            return '@import "' + node.relativePath(file.fullname) + '";';
        }).join('\n'), node.resolvePath(this.getTargetName(suffix)));
    },
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
            return _this.node.wwwRootPath(urlFilename);
        });
        return preprocessCss;
    }
});
